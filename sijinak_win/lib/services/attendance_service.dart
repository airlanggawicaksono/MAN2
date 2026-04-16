import 'dart:async';
import '../data/local/database.dart';
import '../data/hikvision/hik_event.dart';
import 'hikvision_service.dart';

/// Listens to the shared HikvisionService event stream and records
/// attendance (tap in / tap out) for known cards.
class AttendanceService {
  final AttendanceStorePort db;
  final HikvisionService hikService;

  StreamSubscription? _sub;
  bool _running = false;

  /// Callback fired when a card tap is detected and the student is known.
  /// The UI is responsible for showing the popup and saving the record.
  void Function(HikEvent event, Student student, String suggestedType)? onTapDetected;

  AttendanceService({required this.db, required this.hikService});

  void start() {
    if (_running) return;
    _running = true;
    _sub = hikService.events.listen(_handleEvent);
  }

  void stop() {
    _running = false;
    _sub?.cancel();
    _sub = null;
  }

  /// Convert Hikvision employeeNo (32 hex, no hyphens) back to UUID format.
  String _toUuid(String employeeNo) {
    final h = employeeNo;
    if (h.length != 32) return employeeNo;
    return '${h.substring(0, 8)}-${h.substring(8, 12)}-${h.substring(12, 16)}'
        '-${h.substring(16, 20)}-${h.substring(20)}';
  }

  /// Get the existing local record for today to check for duplicates.
  Future<TapRecord?> getExistingTodayRecord(String userId, String eventType) async {
    final today = await db.getTodayRecordsForStudent(userId);
    try {
      return today.firstWhere((r) => r.eventType == eventType);
    } catch (_) {
      return null;
    }
  }

  Future<void> _handleEvent(HikEvent event) async {
    if (event.cardNo.isEmpty) return;

    // Look up student: prefer employeeNo (device already validated the card)
    Student? student;
    if (event.employeeNo != null && event.employeeNo!.isNotEmpty) {
      final userId = _toUuid(event.employeeNo!);
      student = await db.getStudentByUserId(userId);
    }
    // Fallback to cardNo lookup
    student ??= await db.getStudentByCard(event.cardNo);
    if (student == null) return; // unknown card, ignore

    // Let the UI decide based on user input, we just notify a tap happened.
    onTapDetected?.call(event, student, 'unknown');
  }
}
