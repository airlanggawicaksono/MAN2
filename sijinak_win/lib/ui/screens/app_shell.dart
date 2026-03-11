import 'dart:async';
import 'dart:collection';
import 'package:drift/drift.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/hikvision/hik_event.dart';
import '../../data/local/database.dart';
import '../../providers/providers.dart';
import '../widgets/tap_popup.dart';
import 'dashboard.dart';
import 'students_screen.dart';
import 'absensi_screen.dart';

class _TapEntry {
  final HikEvent event;
  final Student student;
  final String suggestedType;
  _TapEntry(this.event, this.student, this.suggestedType);
}

class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  int _selectedIndex = 0;

  static const _destinations = [
    NavigationRailDestination(
      icon: Icon(Icons.dashboard_outlined),
      selectedIcon: Icon(Icons.dashboard),
      label: Text('Dashboard'),
    ),
    NavigationRailDestination(
      icon: Icon(Icons.people_outlined),
      selectedIcon: Icon(Icons.people),
      label: Text('Siswa'),
    ),
    NavigationRailDestination(
      icon: Icon(Icons.fact_check_outlined),
      selectedIcon: Icon(Icons.fact_check),
      label: Text('Absensi'),
    ),
  ];

  bool _hikStarted = false;
  bool _popupShowing = false;
  final Queue<_TapEntry> _queue = Queue();
  final Set<String> _inQueue = {}; // cardNos currently queued or showing

  void _ensureServicesStarted({bool force = false}) {
    final config = ref.read(configProvider).valueOrNull;
    if (config == null) return;

    if ((force || !_hikStarted) && config.isHikvisionConfigured) {
      ref.read(hikvisionServiceProvider).start(config);
      final attendance = ref.read(attendanceServiceProvider);
      attendance.onTapDetected = _onTapDetected;
      attendance.start();
      _hikStarted = true;
    }
  }

  void _onTapDetected(HikEvent event, Student student, String suggestedType) {
    if (_inQueue.contains(student.cardNo)) return; // already queued
    _inQueue.add(student.cardNo ?? event.cardNo);
    _queue.add(_TapEntry(event, student, suggestedType));
    _maybeShowNext();
  }

  void _maybeShowNext() {
    if (_popupShowing || _queue.isEmpty) return;
    final entry = _queue.removeFirst();
    _showPopup(entry);
  }

  Future<void> _showPopup(_TapEntry entry) async {
    _popupShowing = true;

    final result = await showDialog<TapPopupResult>(
      context: context,
      barrierDismissible: false,
      builder: (_) => TapPopupDialog(
        student: entry.student,
        attendanceService: ref.read(attendanceServiceProvider),
      ),
    );

    _inQueue.remove(entry.student.cardNo ?? entry.event.cardNo);
    _popupShowing = false;

    if (result != null) {
      await _saveRecord(entry, result);
    }

    _maybeShowNext();
  }

  Future<void> _saveRecord(_TapEntry entry, TapPopupResult result) async {
    final db = ref.read(databaseProvider);
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    
    // Use existing record ID if overwriting, otherwise generate new one based on event
    final recordId = result.existingRecordId ?? '${entry.event.cardNo}_${entry.event.serialNo}';

    await db.into(db.tapRecords).insert(
      TapRecordsCompanion(
        id: Value(recordId),
        cardNo: Value(entry.event.cardNo),
        eventType: Value(result.eventType),
        deviceTime: Value(entry.event.dateTime.millisecondsSinceEpoch ~/ 1000),
        hikSerialNo: Value(entry.event.serialNo),
        createdAt: Value(now),
        reason: Value(result.reason),
        publishedAt: const Value(null),
      ),
      mode: InsertMode.insertOrReplace,
    );

    ref.invalidate(recentRecordsProvider);
    ref.invalidate(pendingSyncCountProvider);
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(configProvider, (_, next) {
      final config = next.valueOrNull;
      if (config != null) {
        _ensureServicesStarted(force: true);
      }
    });
    _ensureServicesStarted();

    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: _selectedIndex,
            onDestinationSelected: (i) => setState(() => _selectedIndex = i),
            labelType: NavigationRailLabelType.all,
            destinations: _destinations,
            backgroundColor: colors.surfaceContainerLow,
            indicatorColor: colors.primaryContainer,
          ),
          VerticalDivider(thickness: 1, width: 1, color: colors.outlineVariant),
          Expanded(
            child: IndexedStack(
              index: _selectedIndex,
              children: const [
                DashboardScreen(),
                StudentsScreen(),
                AbsensiScreen(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
