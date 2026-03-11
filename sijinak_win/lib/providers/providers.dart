import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../data/local/database.dart';
import '../data/remote/api_client.dart';
import '../services/attendance_service.dart';
import '../services/hikvision_service.dart';
import '../services/student_service.dart';
import '../services/sync_service.dart';

// Database - singleton
final databaseProvider = Provider<AppDatabase>((_) => AppDatabase.instance);

// Config - async, loaded from disk
final configProvider =
    AsyncNotifierProvider<ConfigNotifier, AppConfig>(ConfigNotifier.new);

class ConfigNotifier extends AsyncNotifier<AppConfig> {
  @override
  Future<AppConfig> build() => AppConfig.load();

  Future<void> updateConfig(AppConfig config) async {
    await config.save();
    state = AsyncData(config);
  }
}

// Hikvision service - singleton
final hikvisionServiceProvider = Provider<HikvisionService>((_) {
  return HikvisionService();
});

// Student service
final studentServiceProvider = Provider<StudentService>((ref) {
  return StudentService(ref.read(databaseProvider));
});

// Attendance service - singleton
final attendanceServiceProvider = Provider<AttendanceService>((ref) {
  return AttendanceService(
    db: ref.read(databaseProvider),
    hikService: ref.read(hikvisionServiceProvider),
  );
});

// Sync service - singleton
final syncServiceProvider = Provider<SyncService>((ref) {
  return SyncService(ref.read(databaseProvider));
});

// Dashboard data
final recentRecordsProvider = FutureProvider<List<TapRecord>>((ref) {
  final db = ref.read(databaseProvider);
  return db.getRecentRecords();
});

final allStudentsProvider = FutureProvider<List<Student>>((ref) {
  final db = ref.read(databaseProvider);
  return db.getAllStudents();
});

// Student sync
final studentSyncProvider =
    AsyncNotifierProvider<StudentSyncNotifier, StudentSyncState>(
        StudentSyncNotifier.new);

class StudentSyncState {
  final int count;
  final DateTime? lastSyncedAt;
  final bool syncing;
  final String? error;

  const StudentSyncState({
    this.count = 0,
    this.lastSyncedAt,
    this.syncing = false,
    this.error,
  });

  StudentSyncState copyWith({
    int? count,
    DateTime? lastSyncedAt,
    bool? syncing,
    String? error,
  }) =>
      StudentSyncState(
        count: count ?? this.count,
        lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
        syncing: syncing ?? this.syncing,
        error: error,
      );
}

class StudentSyncNotifier extends AsyncNotifier<StudentSyncState> {
  @override
  Future<StudentSyncState> build() async {
    final db = ref.read(databaseProvider);
    final count = await db.getStudentCount();
    return StudentSyncState(count: count);
  }

  Future<void> syncStudents() async {
    final config = ref.read(configProvider).valueOrNull;
    if (config == null || !config.isServerConfigured) return;

    state = AsyncData(
      (state.valueOrNull ?? const StudentSyncState()).copyWith(
        syncing: true,
        error: null,
      ),
    );

    try {
      final api = ApiClient.fromConfig(config);
      final data = await api.fetchStudents();
      final db = ref.read(databaseProvider);
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;

      final rows = data.map((s) {
        return StudentsCompanion(
          userId: Value(s['user_id'] as String),
          nama: Value(s['nama_lengkap'] as String),
          nis: Value(s['nis'] as String?),
          kelas: Value(s['kelas_jurusan'] as String?),
          syncedAt: Value(now),
        );
      }).toList();

      if (rows.isNotEmpty) {
        await db.upsertStudents(rows);
      }

      final count = await db.getStudentCount();
      state = AsyncData(StudentSyncState(
        count: count,
        lastSyncedAt: DateTime.now(),
        syncing: false,
      ));
    } catch (e) {
      final current = state.valueOrNull ?? const StudentSyncState();
      state = AsyncData(current.copyWith(
        syncing: false,
        error: e.toString(),
      ));
    }
  }
}

// Dashboard stats
final pendingSyncCountProvider = FutureProvider<int>((ref) async {
  final db = ref.read(databaseProvider);
  return db.getUnpublishedCount();
});

class GlobalSyncState {
  final bool syncing;
  final String? error;
  final int? lastAttendanceSynced;
  final DateTime? lastSyncedAt;

  const GlobalSyncState({
    this.syncing = false,
    this.error,
    this.lastAttendanceSynced,
    this.lastSyncedAt,
  });

  GlobalSyncState copyWith({
    bool? syncing,
    String? error,
    int? lastAttendanceSynced,
    DateTime? lastSyncedAt,
  }) =>
      GlobalSyncState(
        syncing: syncing ?? this.syncing,
        error: error,
        lastAttendanceSynced: lastAttendanceSynced ?? this.lastAttendanceSynced,
        lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      );
}

class GlobalSyncNotifier extends AsyncNotifier<GlobalSyncState> {
  @override
  Future<GlobalSyncState> build() async => const GlobalSyncState();

  Future<void> syncAll() async {
    final config = ref.read(configProvider).valueOrNull;
    if (config == null || !config.isServerConfigured) return;

    state = AsyncData((state.valueOrNull ?? const GlobalSyncState()).copyWith(
      syncing: true,
      error: null,
    ));

    try {
      // 1. Downstream Simplex: Pull Students
      await ref.read(studentSyncProvider.notifier).syncStudents();
      
      // 2. Upstream Simplex: Push Attendance
      final syncService = ref.read(syncServiceProvider);
      final count = await syncService.manualBulkSync(config);

      // Invalidate to refresh UI
      ref.invalidate(allStudentsProvider);
      ref.invalidate(recentRecordsProvider);
      ref.invalidate(pendingSyncCountProvider);

      state = AsyncData(GlobalSyncState(
        syncing: false,
        lastAttendanceSynced: count,
        lastSyncedAt: DateTime.now(),
      ));
    } catch (e) {
      state = AsyncData((state.valueOrNull ?? const GlobalSyncState()).copyWith(
        syncing: false,
        error: e.toString(),
      ));
    }
  }
}

final globalSyncProvider =
    AsyncNotifierProvider<GlobalSyncNotifier, GlobalSyncState>(
        GlobalSyncNotifier.new);

