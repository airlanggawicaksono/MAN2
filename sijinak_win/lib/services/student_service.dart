import '../config/app_config.dart';
import '../data/local/database.dart';
import '../data/hikvision/isapi_client.dart';
import 'pending_card_cache_service.dart';

/// Result of a bulk push operation, emitted per-student.
class BulkPushProgress {
  final int current;
  final int total;
  final String currentName;
  final int success;
  final int failed;
  final bool done;
  final String? lastError;

  const BulkPushProgress({
    required this.current,
    required this.total,
    required this.currentName,
    required this.success,
    required this.failed,
    required this.done,
    this.lastError,
  });
}

class BulkCardAssignProgress {
  final int current;
  final int total;
  final String currentNis;
  final int success;
  final int skipped;
  final int failed;
  final bool done;
  final List<String> errors;

  const BulkCardAssignProgress({
    required this.current,
    required this.total,
    required this.currentNis,
    required this.success,
    required this.skipped,
    required this.failed,
    required this.done,
    this.errors = const [],
  });
}

class CardAlreadyAssignedException implements Exception {
  final String cardNo;
  final String ownerName;
  CardAlreadyAssignedException(this.cardNo, this.ownerName);

  @override
  String toString() => 'Kartu $cardNo sudah dipakai oleh $ownerName';
}

class StudentService {
  final StudentStorePort db;
  final HikvisionDevicePort Function(AppConfig config) _hikvisionClientFactory;
  final PendingCardCachePort _pendingCardCache;

  StudentService(
    this.db, {
    HikvisionDevicePort Function(AppConfig config)? hikvisionClientFactory,
    PendingCardCachePort? pendingCardCache,
  }) : _hikvisionClientFactory = hikvisionClientFactory ??
            ((config) => IsapiClient(
                  baseUrl: config.hikvisionBaseUrl,
                  username: config.hikvisionUser,
                  password: config.hikvisionPassword,
                )),
       _pendingCardCache = pendingCardCache ?? PendingCardCacheService();

  Future<List<Student>> loadStudents() => db.getAllStudents();

  Future<List<Student>> getUnregistered() => db.getUnregisteredStudents();

  /// Try to resolve pending NIS->card assignments that were imported before
  /// the student existed in local DB. Returns number of applied rows.
  Future<int> applyPendingCardAssignments(AppConfig config) async {
    final pending = await _pendingCardCache.listAll();
    if (pending.isEmpty) return 0;

    int applied = 0;
    for (final row in pending) {
      try {
        final student = await db.getStudentByNis(row.nis);
        if (student == null) continue;

        if (student.cardNo == row.cardNo) {
          await _pendingCardCache.remove(row.nis);
          continue;
        }

        final duplicate = await checkCardDuplicate(row.cardNo, student.userId);
        if (duplicate != null) {
          // Keep pending; admin can fix conflict later.
          continue;
        }

        if (config.isHikvisionConfigured) {
          final client = _hikvisionClientFactory(config);
          if (!student.hikRegistered) {
            await client.upsertPerson(
              employeeNo: student.userId,
              name: student.nama,
            );
            await db.markHikRegistered(student.userId);
          }
          await client.upsertCard(cardNo: row.cardNo, employeeNo: student.userId);
        }

        await db.assignCardToStudent(student.userId, row.cardNo);
        await _pendingCardCache.remove(row.nis);
        applied++;
      } catch (_) {
        // Keep pending row for next sync retry.
      }
    }

    return applied;
  }

  /// Publish all local students that are not yet marked as registered to Hikvision.
  /// Returns number of successful publishes.
  Future<int> publishUnregisteredToHikvision(AppConfig config) async {
    if (!config.isHikvisionConfigured) return 0;
    final unregistered = await db.getUnregisteredStudents();
    if (unregistered.isEmpty) return 0;

    int success = 0;
    for (final student in unregistered) {
      try {
        await pushToHikvision(student, config);
        success++;
      } catch (_) {
        // Best-effort; next sync cycle will retry.
      }
    }
    return success;
  }

  /// Remove stale cards/persons from Hikvision for users removed from server snapshot.
  /// Admin user IDs should not be passed into this method.
  Future<void> reconcileRemovedFromHikvision({
    required AppConfig config,
    required List<String> removedUserIds,
    required List<String> removedCardNos,
  }) async {
    if (!config.isHikvisionConfigured) return;
    if (removedUserIds.isEmpty && removedCardNos.isEmpty) return;

    final client = _hikvisionClientFactory(config);

    for (final cardNo in removedCardNos) {
      try {
        await client.deleteCard(cardNo: cardNo);
      } catch (_) {
        // Ignore per-card failures; continue best-effort reconciliation.
      }
    }

    for (final userId in removedUserIds) {
      try {
        await client.deletePerson(employeeNo: userId);
      } catch (_) {
        // Ignore per-person failures; continue best-effort reconciliation.
      }
    }
  }

  /// Push a single student to Hikvision and mark as registered.
  Future<void> pushToHikvision(Student student, AppConfig config) async {
    final client = _hikvisionClientFactory(config);
    await client.upsertPerson(
      employeeNo: student.userId,
      name: student.nama,
    );
    if (student.cardNo != null && student.cardNo!.isNotEmpty) {
      await client.upsertCard(cardNo: student.cardNo!, employeeNo: student.userId);
    }
    await db.markHikRegistered(student.userId);
  }

  /// Check if card is already assigned to another student.
  /// Returns the owner if duplicate, null if available.
  Future<Student?> checkCardDuplicate(String cardNo, String excludeUserId) async {
    final existing = await db.getStudentByCard(cardNo);
    if (existing != null && existing.userId != excludeUserId) {
      return existing;
    }
    return null;
  }

  /// Assign a card to a student on both Hikvision and local DB.
  /// Throws [CardAlreadyAssignedException] if card belongs to another student.
  Future<void> assignCard(Student student, String cardNo, AppConfig config) async {
    // Check for duplicate in local DB
    final existing = await checkCardDuplicate(cardNo, student.userId);
    if (existing != null) {
      throw CardAlreadyAssignedException(cardNo, existing.nama);
    }

    final client = _hikvisionClientFactory(config);

    // Only register person if not already on device
    if (!student.hikRegistered) {
      print('[assignCard] registering person ${student.userId}');
      await client.upsertPerson(
        employeeNo: student.userId,
        name: student.nama,
      );
      await db.markHikRegistered(student.userId);
      print('[assignCard] person registered');
    } else {
      print('[assignCard] person already registered, skipping');
    }

    print('[assignCard] assigning card $cardNo to ${student.userId}');
    await client.upsertCard(
      cardNo: cardNo,
      employeeNo: student.userId,
    );
    print('[assignCard] card assigned on device');
    await db.assignCardToStudent(student.userId, cardNo);
    print('[assignCard] card saved to DB');
  }

  /// Remove card from student (local DB + Hikvision).
  Future<void> removeCard(Student student, AppConfig config) async {
    if (student.cardNo == null) return;

    if (config.isHikvisionConfigured) {
      try {
        final client = _hikvisionClientFactory(config);
        await client.deleteCard(cardNo: student.cardNo!);
      } catch (_) {
        // Card might not exist on device, continue anyway
      }
    }

    await db.removeCardFromStudent(student.userId);
  }

  /// Bulk assign cards from CSV data (list of {nis, cardNo} maps).
  /// Yields progress per row.
  Stream<BulkCardAssignProgress> bulkAssignCards(
    List<Map<String, String>> rows,
    AppConfig config,
  ) async* {
    final client = config.isHikvisionConfigured
        ? _hikvisionClientFactory(config)
        : null;

    int success = 0;
    int skipped = 0;
    int failed = 0;
    final errors = <String>[];

    for (int i = 0; i < rows.length; i++) {
      final nis = rows[i]['nis']!;
      final cardNo = rows[i]['cardNo']!;

      yield BulkCardAssignProgress(
        current: i + 1,
        total: rows.length,
        currentNis: nis,
        success: success,
        skipped: skipped,
        failed: failed,
        done: false,
      );

      try {
        final student = await db.getStudentByNis(nis);
        if (student == null) {
          skipped++;
          await _pendingCardCache.upsert(nis, cardNo);
          errors.add('NIS $nis: siswa belum ada di local DB, disimpan ke cache');
          continue;
        }

        if (student.cardNo == cardNo) {
          skipped++;
          continue;
        }

        // Check duplicate
        final existing = await checkCardDuplicate(cardNo, student.userId);
        if (existing != null) {
          failed++;
          errors.add('NIS $nis: kartu $cardNo sudah dipakai ${existing.nama}');
          continue;
        }

        // Push to Hikvision
        if (client != null) {
          if (!student.hikRegistered) {
            await client.upsertPerson(
              employeeNo: student.userId,
              name: student.nama,
            );
            await db.markHikRegistered(student.userId);
          }
          await client.upsertCard(cardNo: cardNo, employeeNo: student.userId);
        }

        await db.assignCardToStudent(student.userId, cardNo);
        success++;
      } catch (e) {
        failed++;
        errors.add('NIS $nis: $e');
      }
    }

    yield BulkCardAssignProgress(
      current: rows.length,
      total: rows.length,
      currentNis: '',
      success: success,
      skipped: skipped,
      failed: failed,
      done: true,
      errors: errors,
    );
  }

  /// Push unregistered students one-by-one, yielding progress.
  Stream<BulkPushProgress> pushBulk(List<Student> students, AppConfig config) async* {
    final client = _hikvisionClientFactory(config);

    int success = 0;
    int failed = 0;
    String? lastError;

    for (int i = 0; i < students.length; i++) {
      final s = students[i];
      yield BulkPushProgress(
        current: i + 1,
        total: students.length,
        currentName: s.nama,
        success: success,
        failed: failed,
        done: false,
      );

      try {
        await client.upsertPerson(employeeNo: s.userId, name: s.nama);
        await db.markHikRegistered(s.userId);
        success++;
      } catch (e) {
        failed++;
        lastError = e.toString();
      }
    }

    yield BulkPushProgress(
      current: students.length,
      total: students.length,
      currentName: '',
      success: success,
      failed: failed,
      done: true,
      lastError: lastError,
    );
  }
}
