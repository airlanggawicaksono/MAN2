import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

import 'tables/students.dart';
import 'tables/tap_records.dart';

part 'database.g.dart';

@DriftDatabase(tables: [Students, TapRecords])
class AppDatabase extends _$AppDatabase {
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
