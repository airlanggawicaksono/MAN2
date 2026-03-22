import 'dart:async';
import 'dart:collection';
import 'package:drift/drift.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/app_config.dart';
import '../../data/hikvision/hik_event.dart';
import '../../data/local/database.dart';
import '../../providers/providers.dart';
import '../../services/network_discovery_service.dart';
import '../../services/izin_payload.dart';
import '../../services/ticket_printer_service.dart';
import '../../services/server_service.dart';
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
  DateTime? _lastNavTriggeredSyncAt;
  bool _navigating = false;

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
  bool _hikStarting = false;
  String? _startedConfigFingerprint;
  Timer? _syncTimer;
  bool _syncRunning = false;
  bool _popupShowing = false;
  DateTime? _lastBackendCheckAt;
  bool _lastBackendCheckOk = false;
  final Queue<_TapEntry> _queue = Queue();
  final Set<String> _inQueue = {}; // cardNos currently queued or showing

  void _ensureServicesStarted({bool force = false}) {
    final config = ref.read(configProvider).asData?.value;
    if (config == null) return;

    final fingerprint =
        '${config.hikvisionIp}|${config.hikvisionUser}|${config.hikvisionPassword}|${config.hikvisionMac}';
    if (!force && _hikStarted && _startedConfigFingerprint == fingerprint) {
      return;
    }
    if (_hikStarting || !config.isHikvisionConfigured) return;

    _hikStarting = true;
    unawaited(_startHikvisionWithAutoDetect(config));
  }

  Future<void> _startHikvisionWithAutoDetect(AppConfig initialConfig) async {
    var config = initialConfig;

    try {
      final hasManualIp = config.hikvisionIp.trim().isNotEmpty;
      final mac = config.hikvisionMac.trim();
      if (!hasManualIp && mac.isNotEmpty) {
        final detectedIp = await NetworkDiscoveryService.findIpByMac(mac);
        if (detectedIp != null && detectedIp != config.hikvisionIp) {
          final updatedConfig = AppConfig(
            hikvisionIp: detectedIp,
            hikvisionUser: config.hikvisionUser,
            hikvisionPassword: config.hikvisionPassword,
            hikvisionMac: config.hikvisionMac,
            serverUrl: config.serverUrl,
            apiKey: config.apiKey,
            thermalPrinterKey: config.thermalPrinterKey,
            thermalPrinterName: config.thermalPrinterName,
          );
          await ref.read(configProvider.notifier).updateConfig(updatedConfig);
          config = updatedConfig;
        }
      }

      ref.read(hikvisionServiceProvider).start(config);
      final attendance = ref.read(attendanceServiceProvider);
      attendance.onTapDetected = _onTapDetected;
      attendance.start();

      _hikStarted = true;
      _startedConfigFingerprint =
          '${config.hikvisionIp}|${config.hikvisionUser}|${config.hikvisionPassword}|${config.hikvisionMac}';
    } finally {
      _hikStarting = false;
    }
  }

  void _onTapDetected(HikEvent event, Student student, String suggestedType) {
    if (_inQueue.contains(student.cardNo)) return; // already queued
    _inQueue.add(student.cardNo ?? event.cardNo);
    _queue.add(_TapEntry(event, student, suggestedType));
    _maybeShowNext();
  }

  @override
  void initState() {
    super.initState();
    _startAutoSyncLoop();
  }

  void _startAutoSyncLoop() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      unawaited(_syncInBackground());
    });
    unawaited(_syncInBackground());
  }

  Future<void> _syncInBackground() async {
    if (_syncRunning) return;
    final config = ref.read(configProvider).asData?.value;
    if (config == null || !config.isServerConfigured) return;

    _syncRunning = true;
    try {
      await ref.read(globalSyncProvider.notifier).syncAll();
    } catch (_) {
      // Keep loop running; failures are already reflected in provider state.
    } finally {
      _syncRunning = false;
    }
  }

  void _onDestinationSelected(int index) {
    if (_selectedIndex == index) return;

    setState(() => _selectedIndex = index);
    setState(() => _navigating = true);
    Future.delayed(const Duration(milliseconds: 260), () {
      if (!mounted) return;
      setState(() => _navigating = false);
    });

    // Hidden refresh behavior: entering Dashboard/Siswa triggers immediate sync.
    if (index == 0 || index == 1) {
      final now = DateTime.now();
      final last = _lastNavTriggeredSyncAt;
      if (last == null || now.difference(last) >= const Duration(seconds: 10)) {
        _lastNavTriggeredSyncAt = now;
        unawaited(_syncInBackground());
      }
    }
  }

  void _maybeShowNext() {
    if (_popupShowing || _queue.isEmpty) return;
    final entry = _queue.removeFirst();
    _showPopup(entry);
  }

  Future<void> _showPopup(_TapEntry entry) async {
    _popupShowing = true;
    final backendOk = await _ensureBackendReadyForAttendance();
    if (!backendOk) {
      _inQueue.remove(entry.student.cardNo ?? entry.event.cardNo);
      _popupShowing = false;
      _maybeShowNext();
      return;
    }

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
      if (result.eventType == 'izin') {
        final printed = await _printIzinTicket(entry.student, result);
        if (!printed) {
          _maybeShowNext();
          return;
        }
      }
      await _saveRecord(entry, result);
    }

    _maybeShowNext();
  }

  Future<bool> _ensureBackendReadyForAttendance() async {
    final now = DateTime.now();
    if (_lastBackendCheckAt != null) {
      final age = now.difference(_lastBackendCheckAt!);
      if (_lastBackendCheckOk && age < const Duration(seconds: 15)) {
        return true;
      }
      if (!_lastBackendCheckOk && age < const Duration(seconds: 5)) {
        return false;
      }
    }

    final config = ref.read(configProvider).asData?.value;
    if (config == null || !config.isServerConfigured) {
      await _showBackendRequiredDialog();
      _lastBackendCheckAt = now;
      _lastBackendCheckOk = false;
      return false;
    }

    final result = await ServerService.testConnection(
      config.serverUrl,
      config.apiKey,
    );
    final ok = result.success;
    _lastBackendCheckAt = now;
    _lastBackendCheckOk = ok;

    if (!ok) {
      await _showBackendRequiredDialog();
    }
    return ok;
  }

  Future<void> _showBackendRequiredDialog() async {
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Backend Belum Terkoneksi'),
        content: const Text(
          'Pastikan terkoneksi ke Server terlebih dahulu sebelum melakukan absensi.',
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<void> _saveRecord(_TapEntry entry, TapPopupResult result) async {
    final db = ref.read(databaseProvider);
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;

    // Use existing record ID if overwriting, otherwise generate new one based on event
    final recordId =
        result.existingRecordId ??
        '${entry.event.cardNo}_${entry.event.serialNo}';

    await db
        .into(db.tapRecords)
        .insert(
          TapRecordsCompanion(
            id: Value(recordId),
            cardNo: Value(entry.event.cardNo),
            eventType: Value(result.eventType),
            deviceTime: Value(
              entry.event.dateTime.millisecondsSinceEpoch ~/ 1000,
            ),
            hikSerialNo: Value(entry.event.serialNo),
            createdAt: Value(now),
            reason: Value(
              result.eventType == 'izin'
                  ? encodeIzinReasonPayload(
                      reason: result.reason,
                      perkiraanKembali: result.estimatedReturnAt,
                    )
                  : result.reason,
            ),
            publishedAt: const Value(null),
          ),
          mode: InsertMode.insertOrReplace,
        );

    ref.invalidate(recentRecordsProvider);
    ref.invalidate(pendingSyncCountProvider);
    unawaited(_syncInBackground());
  }

  Future<bool> _printIzinTicket(Student student, TapPopupResult result) async {
    final reason = result.reason?.trim();
    if (reason == null || reason.isEmpty) return false;
    final config = ref.read(configProvider).asData?.value;
    final preferredPrinterKey = config?.thermalPrinterKey;

    final printerReady = await ref
        .read(ticketPrinterServiceProvider)
        .isPrinterReady(preferredPrinterKey: preferredPrinterKey);
    if (!printerReady) {
      if (!mounted) return false;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Printer thermal tidak terhubung. Proses izin dibatalkan.',
          ),
        ),
      );
      return false;
    }

    final payload = IzinTicketPayload(
      studentName: student.nama,
      nis: student.nis,
      alasanIzin: reason,
      waktuKeluar: DateTime.now(),
      perkiraanKembali: result.estimatedReturnAt,
    );

    try {
      await ref
          .read(ticketPrinterServiceProvider)
          .printIzinTicket(
            payload,
            copyNumber: 1,
            preferredPrinterKey: preferredPrinterKey,
          );
    } catch (e) {
      if (!mounted) return false;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Cetak tiket gagal: $e')));
      return false;
    }

    if (!mounted) return false;
    final confirmSecondCopy = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cetak Ulang Salinan Kedua'),
        content: const Text(
          'Copy pertama sudah tercetak. Lanjut cetak copy kedua?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Tidak'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Cetak'),
          ),
        ],
      ),
    );

    if (confirmSecondCopy != true) return true;

    try {
      await ref
          .read(ticketPrinterServiceProvider)
          .printIzinTicket(
            payload,
            copyNumber: 2,
            preferredPrinterKey: preferredPrinterKey,
          );
    } catch (e) {
      if (!mounted) return false;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Cetak copy kedua gagal: $e')));
    }
    return true;
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    ref.read(attendanceServiceProvider).stop();
    ref.read(hikvisionServiceProvider).stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(configProvider, (_, next) {
      final config = next.asData?.value;
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
            onDestinationSelected: _onDestinationSelected,
            labelType: NavigationRailLabelType.all,
            destinations: _destinations,
            backgroundColor: colors.surfaceContainerLow,
            indicatorColor: colors.primaryContainer,
          ),
          VerticalDivider(thickness: 1, width: 1, color: colors.outlineVariant),
          Expanded(
            child: Stack(
              children: [
                IndexedStack(
                  index: _selectedIndex,
                  children: const [
                    DashboardScreen(),
                    StudentsScreen(),
                    AbsensiScreen(),
                  ],
                ),
                if (_navigating)
                  Positioned.fill(
                    child: IgnorePointer(
                      ignoring: true,
                      child: ColoredBox(
                        color: colors.surface.withOpacity(0.45),
                        child: const Center(
                          child: SizedBox(
                            width: 26,
                            height: 26,
                            child: CircularProgressIndicator(strokeWidth: 2.4),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
