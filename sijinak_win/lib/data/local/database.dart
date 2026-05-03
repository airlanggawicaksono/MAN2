import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

import 'tables/students.dart';
import 'tables/tap_records.dart';

part 'database.g.dart';

abstract class StudentStorePort {
  Future<List<Student>> getAllStudents();
  Future<int> getStudentCount();
  Future<Student?> getStudentByCard(String cardNo);
  Future<Student?> getStudentByUserId(String userId);
  Future<Student?> getStudentByNis(String nis);
  Future<void> upsertStudents(List<StudentsCompanion> rows);
  Future<StudentSnapshotSyncResult> syncStudentsSnapshot({
    required List<StudentsCompanion> rows,
    required Set<String> serverUserIds,
    Set<String> protectedUserIds,
  });
  Future<List<Student>> getUnregisteredStudents();
  Future<void> markHikRegistered(String userId);
  Future<void> assignCardToStudent(String userId, String cardNo);
  Future<void> removeCardFromStudent(String userId);
}

abstract class AttendanceStorePort {
  Future<Student?> getStudentByUserId(String userId);
  Future<Student?> getStudentByCard(String cardNo);
  Future<List<TapRecord>> getTodayRecordsForStudent(String userId);
  Future<List<TapRecord>> getTodayRecordsForCard(String cardNo);
}

abstract class SyncStorePort {
  Future<List<TapRecord>> getUnpublishedRecords();
  Future<Student?> getStudentByUserId(String userId);
  Future<Student?> getStudentByCard(String cardNo);
  Future<void> markPublished(String recordId, int publishedAt);
}

class StudentSnapshotSyncResult {
  final List<String> removedUserIds;
  final List<String> removedCardNos;
  // Cards that were cleared from existing students (card_no set to null on server)
  final List<String> revokedCardNos;

  const StudentSnapshotSyncResult({
    this.removedUserIds = const [],
    this.removedCardNos = const [],
    this.revokedCardNos = const [],
  });
}

@DriftDatabase(tables: [Students, TapRecords])
class AppDatabase extends _$AppDatabase
    implements StudentStorePort, AttendanceStorePort, SyncStorePort {
  AppDatabase._() : super(_openConnection());

  static final AppDatabase instance = AppDatabase._();

  @override
  int get schemaVersion => 5;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          if (from < 3) {
            await m.deleteTable('students');
            await m.createTable(students);
          }
          if (from < 4) {
            // Reset legacy history rows that were tied to mutable card ownership.
            await delete(tapRecords).go();
          }
          if (from < 5) {
            await m.addColumn(students, students.noTelpWali);
          }
        },
      );

  // ── Students ──────────────────────────────────────────────────────────

  @override
  Future<List<Student>> getAllStudents() => select(students).get();

  @override
  Future<int> getStudentCount() async {
    final count = countAll();
    final query = selectOnly(students)..addColumns([count]);
    final row = await query.getSingle();
    return row.read(count)!;
  }

  @override
  Future<Student?> getStudentByCard(String cardNo) => (select(students)
        ..where((s) => s.cardNo.equals(cardNo)))
      .getSingleOrNull();

  @override
  Future<Student?> getStudentByUserId(String userId) => (select(students)
        ..where((s) => s.userId.equals(userId)))
      .getSingleOrNull();

  @override
  Future<Student?> getStudentByNis(String nis) => (select(students)
        ..where((s) => s.nis.equals(nis)))
      .getSingleOrNull();

  @override
  Future<void> upsertStudents(List<StudentsCompanion> rows) async {
    await batch((b) {
      for (final row in rows) {
        b.insert(
          students,
          row,
          onConflict: DoUpdate(
            (old) => StudentsCompanion(
              nama: row.nama,
              nis: row.nis,
              kelas: row.kelas,
              // card_no is now server-authoritative
              cardNo: row.cardNo,
              noTelpWali: row.noTelpWali,
              syncedAt: row.syncedAt,
            ),
            target: [students.userId],
          ),
        );
      }
    });
  }

  /// Mirror students table to match server snapshot exactly.
  /// card_no is now server-authoritative: synced from server, resets hikRegistered on change.
  @override
  Future<StudentSnapshotSyncResult> syncStudentsSnapshot({
    required List<StudentsCompanion> rows,
    required Set<String> serverUserIds,
    Set<String> protectedUserIds = const {},
  }) async {
    final beforeRows = await getAllStudents();
    final beforeByUserId = <String, Student>{
      for (final s in beforeRows) s.userId: s,
    };

    // Detect card changes before upsert to compute revokedCardNos and reset hikRegistered
    final cardChangedUserIds = <String>[];
    final revokedCardNos = <String>[];
    for (final row in rows) {
      final userId = row.userId.value;
      final newCard = row.cardNo.present ? row.cardNo.value : null;
      final old = beforeByUserId[userId];
      if (old != null && old.cardNo != newCard) {
        cardChangedUserIds.add(userId);
        // Old card removed or replaced — revoke from Hikvision
        if (old.cardNo != null && old.cardNo!.isNotEmpty) {
          revokedCardNos.add(old.cardNo!);
        }
      }
    }

    await transaction(() async {
      if (rows.isNotEmpty) {
        await upsertStudents(rows);
      }

      // Reset hikRegistered for students with changed card → triggers re-push
      if (cardChangedUserIds.isNotEmpty) {
        await (update(students)
              ..where((s) => s.userId.isIn(cardChangedUserIds)))
            .write(const StudentsCompanion(hikRegistered: Value(false)));
      }

      final retainedUserIds = <String>{...serverUserIds, ...protectedUserIds};

      if (retainedUserIds.isEmpty) {
        await delete(students).go();
        await delete(tapRecords).go();
        return;
      }

      await (delete(students)
            ..where((s) => s.userId.isNotIn(retainedUserIds.toList())))
          .go();

      final activeStudents = await getAllStudents();
      final activeCards = activeStudents
          .map((s) => s.cardNo)
          .whereType<String>()
          .where((c) => c.isNotEmpty)
          .toSet()
          .toList();

      if (activeCards.isEmpty) {
        await delete(tapRecords).go();
      } else {
        await (delete(tapRecords)
              ..where((r) => r.cardNo.isNotIn(activeCards)))
            .go();
      }
    });

    final removedUserIds = beforeByUserId.keys
        .where((id) => !serverUserIds.contains(id) && !protectedUserIds.contains(id))
        .toList();
    final removedCardNos = removedUserIds
        .map((id) => beforeByUserId[id]?.cardNo)
        .whereType<String>()
        .where((c) => c.isNotEmpty)
        .toSet()
        .toList();

    return StudentSnapshotSyncResult(
      removedUserIds: removedUserIds,
      removedCardNos: removedCardNos,
      revokedCardNos: revokedCardNos,
    );
  }

  @override
  Future<List<Student>> getUnregisteredStudents() =>
      (select(students)..where((s) => s.hikRegistered.equals(false))).get();

  @override
  Future<void> markHikRegistered(String userId) =>
      (update(students)..where((s) => s.userId.equals(userId))).write(
        const StudentsCompanion(hikRegistered: Value(true)),
      );

  @override
  Future<void> assignCardToStudent(String userId, String cardNo) =>
      (update(students)..where((s) => s.userId.equals(userId))).write(
        StudentsCompanion(cardNo: Value(cardNo)),
      );

  @override
  Future<void> removeCardFromStudent(String userId) =>
      (update(students)..where((s) => s.userId.equals(userId))).write(
        const StudentsCompanion(cardNo: Value(null)),
      );

  // ── Tap Records ───────────────────────────────────────────────────────

  Future<int> insertTapRecord(TapRecordsCompanion record) =>
      into(tapRecords).insert(record, mode: InsertMode.insertOrIgnore);

  @override
  Future<List<TapRecord>> getUnpublishedRecords() =>
      (select(tapRecords)..where((r) => r.publishedAt.isNull())).get();

  Stream<List<TapRecord>> watchUnpublishedRecords() =>
      (select(tapRecords)..where((r) => r.publishedAt.isNull())).watch();

  Future<int> getUnpublishedCount() async {
    final count = countAll();
    final query = selectOnly(tapRecords)
      ..addColumns([count])
      ..where(tapRecords.publishedAt.isNull());
    final row = await query.getSingle();
    return row.read(count)!;
  }

  @override
  Future<List<TapRecord>> getTodayRecordsForCard(String cardNo) {
    final now = DateTime.now();
    final startOfDay =
        DateTime(now.year, now.month, now.day).millisecondsSinceEpoch ~/ 1000;
    final endOfDay = startOfDay + 86400;
    return (select(tapRecords)
          ..where(
            (r) =>
                r.cardNo.equals(cardNo) &
                r.deviceTime.isBiggerOrEqualValue(startOfDay) &
                r.deviceTime.isSmallerThanValue(endOfDay),
          )
          ..orderBy([(r) => OrderingTerm.asc(r.deviceTime)]))
        .get();
  }

  @override
  Future<List<TapRecord>> getTodayRecordsForStudent(String userId) {
    final now = DateTime.now();
    final startOfDay =
        DateTime(now.year, now.month, now.day).millisecondsSinceEpoch ~/ 1000;
    final endOfDay = startOfDay + 86400;
    return (select(tapRecords)
          ..where(
            (r) =>
                r.id.like('${userId}_%') &
                r.deviceTime.isBiggerOrEqualValue(startOfDay) &
                r.deviceTime.isSmallerThanValue(endOfDay),
          )
          ..orderBy([(r) => OrderingTerm.asc(r.deviceTime)]))
        .get();
  }

  @override
  Future<void> markPublished(String recordId, int publishedAt) =>
      (update(tapRecords)..where((r) => r.id.equals(recordId))).write(
        TapRecordsCompanion(publishedAt: Value(publishedAt)),
      );

  Future<List<TapRecord>> getRecentRecords({int limit = 50}) =>
      (select(tapRecords)
            ..orderBy([(r) => OrderingTerm.desc(r.createdAt)])
            ..limit(limit))
          .get();
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationSupportDirectory();
    final file = File(p.join(dir.path, 'sijinak.db'));
    return NativeDatabase.createInBackground(file);
  });
}
