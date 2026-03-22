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
  Future<List<TapRecord>> getTodayRecordsForCard(String cardNo);
}

abstract class SyncStorePort {
  Future<List<TapRecord>> getUnpublishedRecords();
  Future<Student?> getStudentByCard(String cardNo);
  Future<void> markPublished(String recordId, int publishedAt);
}

class StudentSnapshotSyncResult {
  final List<String> removedUserIds;
  final List<String> removedCardNos;

  const StudentSnapshotSyncResult({
    this.removedUserIds = const [],
    this.removedCardNos = const [],
  });
}

@DriftDatabase(tables: [Students, TapRecords])
class AppDatabase extends _$AppDatabase
    implements StudentStorePort, AttendanceStorePort, SyncStorePort {
  AppDatabase._() : super(_openConnection());

  static final AppDatabase instance = AppDatabase._();

  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          if (from < 3) {
            await m.deleteTable('students');
            await m.createTable(students);
          }
        },
      );

  // ── Students ──────────────────────────────────────────────────────────

  Future<List<Student>> getAllStudents() => select(students).get();

  Future<int> getStudentCount() async {
    final count = countAll();
    final query = selectOnly(students)..addColumns([count]);
    final row = await query.getSingle();
    return row.read(count)!;
  }

  Future<Student?> getStudentByCard(String cardNo) => (select(students)
        ..where((s) => s.cardNo.equals(cardNo)))
      .getSingleOrNull();

  Future<Student?> getStudentByUserId(String userId) => (select(students)
        ..where((s) => s.userId.equals(userId)))
      .getSingleOrNull();

  Future<Student?> getStudentByNis(String nis) => (select(students)
        ..where((s) => s.nis.equals(nis)))
      .getSingleOrNull();

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
              syncedAt: row.syncedAt,
            ),
            target: [students.userId],
          ),
        );
      }
    });
  }

  /// Mirror students table to match server snapshot exactly.
  /// Also cascades cleanup of tap records for cards that no longer exist.
  Future<StudentSnapshotSyncResult> syncStudentsSnapshot({
    required List<StudentsCompanion> rows,
    required Set<String> serverUserIds,
    Set<String> protectedUserIds = const {},
  }) async {
    final beforeRows = await getAllStudents();
    final beforeByUserId = <String, Student>{
      for (final s in beforeRows) s.userId: s,
    };

    await transaction(() async {
      if (rows.isNotEmpty) {
        await upsertStudents(rows);
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
    );
  }

  Future<List<Student>> getUnregisteredStudents() =>
      (select(students)..where((s) => s.hikRegistered.equals(false))).get();

  Future<void> markHikRegistered(String userId) =>
      (update(students)..where((s) => s.userId.equals(userId))).write(
        const StudentsCompanion(hikRegistered: Value(true)),
      );

  Future<void> assignCardToStudent(String userId, String cardNo) =>
      (update(students)..where((s) => s.userId.equals(userId))).write(
        StudentsCompanion(cardNo: Value(cardNo)),
      );

  Future<void> removeCardFromStudent(String userId) =>
      (update(students)..where((s) => s.userId.equals(userId))).write(
        const StudentsCompanion(cardNo: Value(null)),
      );

  // ── Tap Records ───────────────────────────────────────────────────────

  Future<int> insertTapRecord(TapRecordsCompanion record) =>
      into(tapRecords).insert(record, mode: InsertMode.insertOrIgnore);

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
