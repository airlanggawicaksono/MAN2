import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:excel/excel.dart' as xls;
import 'package:path/path.dart' as p;
import '../../data/local/database.dart';
import '../../providers/providers.dart';
import '../../services/student_service.dart';
import '../../services/app_pubsub.dart';
import '../../services/server_service.dart';
import '../../data/hikvision/alert_stream.dart';
import '../widgets/card_scan_dialog.dart';
import '../widgets/bulk_push_dialog.dart';
import '../widgets/bulk_card_assign_dialog.dart';

class StudentsScreen extends ConsumerStatefulWidget {
  const StudentsScreen({super.key});

  @override
  ConsumerState<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends ConsumerState<StudentsScreen> {
  List<Student> _students = [];
  List<Student> _filtered = [];
  final _searchCtrl = TextEditingController();
  bool _loading = true;
  bool _backendReady = false;
  Timer? _backendProbeTimer;
  DateTime? _lastBackendProbeAt;

  @override
  void initState() {
    super.initState();
    AppPubSub.subscribe(
      key: AppPubSubTopics.studentSynced,
      context: this,
      handler: (_, __) => _loadStudents(),
    );
    AppPubSub.subscribe(
      key: AppPubSubTopics.globalSynced,
      context: this,
      handler: (_, __) => _loadStudents(),
    );
    _loadStudents();
    _searchCtrl.addListener(_applyFilter);
    unawaited(_probeBackendReady(force: true));
    _backendProbeTimer = Timer.periodic(
      const Duration(seconds: 8),
      (_) => unawaited(_probeBackendReady()),
    );
  }

  @override
  void dispose() {
    _backendProbeTimer?.cancel();
    AppPubSub.unsubscribe(context: this);
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadStudents() async {
    final students = await ref.read(studentServiceProvider).loadStudents();
    if (mounted) {
      setState(() {
        _students = students;
        _loading = false;
        _applyFilter();
      });
    }
  }

  void _applyFilter() {
    final q = _searchCtrl.text.trim().toLowerCase();
    setState(() {
      if (q.isEmpty) {
        _filtered = _students;
      } else {
        _filtered = _students.where((s) {
          return s.nama.toLowerCase().contains(q) ||
              (s.nis?.toLowerCase().contains(q) ?? false) ||
              (s.kelas?.toLowerCase().contains(q) ?? false) ||
              (s.cardNo?.toLowerCase().contains(q) ?? false);
        }).toList();
      }
    });
  }

  Future<void> _syncAndReload() async {
    setState(() => _loading = true);
    await ref.read(studentSyncProvider.notifier).syncStudents();
    await _loadStudents();
  }

  Future<void> _pushAllToHikvision() async {
    if (!await _ensureOperationalReady()) {
      return;
    }
    final config = ref.read(configProvider).asData?.value;
    if (config == null) {
      _showSnack('Konfigurasi Hikvision belum lengkap');
      return;
    }

    final unregistered = await ref
        .read(studentServiceProvider)
        .getUnregistered();

    if (unregistered.isEmpty) {
      _showSnack('Semua siswa sudah terdaftar di Hikvision');
      return;
    }

    if (!mounted) return;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => BulkPushDialog(
        students: unregistered,
        config: config,
        db: ref.read(databaseProvider),
      ),
    );

    await _loadStudents();
  }

  Future<void> _pushOneToHikvision(Student student) async {
    if (!await _ensureOperationalReady()) {
      return;
    }
    final config = ref.read(configProvider).asData?.value;
    if (config == null) {
      _showSnack('Konfigurasi Hikvision belum lengkap');
      return;
    }
    try {
      await ref.read(studentServiceProvider).pushToHikvision(student, config);
      _showSnack('${student.nama} berhasil didaftarkan ke Hikvision');
      await _loadStudents();
    } catch (e) {
      _showSnack('Gagal: $e');
    }
  }

  Future<void> _assignCard(Student student) async {
    final config = ref.read(configProvider).asData?.value;
    print(
      '[_assignCard] config=$config isHik=${config?.isHikvisionConfigured}',
    );
    if (!await _ensureOperationalReady()) {
      return;
    }
    final readyConfig = config!;

    final result = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const CardScanDialog(),
    );

    print('[_assignCard] dialog result=$result');
    if (result == null || !mounted) return;

    try {
      await ref
          .read(studentServiceProvider)
          .assignCard(student, result, readyConfig);
      _showSnack('Kartu $result berhasil di-assign ke ${student.nama}');
      await _loadStudents();
    } on CardAlreadyAssignedException catch (e) {
      _showSnack(e.toString());
    } catch (e) {
      _showSnack('Gagal assign kartu: $e');
    }
  }

  Future<void> _removeCard(Student student) async {
    if (!await _ensureOperationalReady()) {
      return;
    }
    final config = ref.read(configProvider).asData?.value;
    if (config == null) {
      _showSnack('Konfigurasi Hikvision belum lengkap');
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Kartu'),
        content: Text('Hapus kartu ${student.cardNo} dari ${student.nama}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    try {
      await ref.read(studentServiceProvider).removeCard(student, config);
      _showSnack('Kartu ${student.cardNo} dihapus dari ${student.nama}');
      await _loadStudents();
    } catch (e) {
      _showSnack('Gagal hapus kartu: $e');
    }
  }

  Future<void> _importCardsCsv() async {
    if (!await _ensureOperationalReady()) {
      return;
    }
    final config = ref.read(configProvider).asData?.value;
    if (config == null) {
      _showSnack('Konfigurasi Hikvision belum lengkap');
      return;
    }

    final proceed = await _showImportInstructionDialog();
    if (proceed != true || !mounted) return;

    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['csv', 'xlsx'],
      dialogTitle: 'Pilih file CSV/XLSX (header: NIS, card_number)',
    );

    if (result == null || result.files.isEmpty || !mounted) return;

    final filePath = result.files.single.path;
    if (filePath == null) return;

    try {
      final rows = await _parseImportRows(filePath);

      if (rows.isEmpty) {
        _showSnack('Tidak ada data valid dalam file CSV/XLSX');
        return;
      }

      if (!mounted) return;

      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => BulkCardAssignDialog(rows: rows, config: config),
      );

      await _loadStudents();
    } catch (e) {
      _showSnack('Gagal membaca CSV: $e');
    }
  }

  Future<List<Map<String, String>>> _parseImportRows(String filePath) async {
    final ext = p.extension(filePath).toLowerCase();
    if (ext == '.xlsx') {
      return _parseXlsxRows(filePath);
    }
    return _parseCsvRows(filePath);
  }

  Future<List<Map<String, String>>> _parseCsvRows(String filePath) async {
    final content = await File(filePath).readAsString();
    final lines = content
        .split(RegExp(r'\r?\n'))
        .where((l) => l.trim().isNotEmpty)
        .toList();

    if (lines.length < 2) {
      throw Exception('File CSV kosong atau hanya header');
    }

    final header = lines.first
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .toList();
    final nisIdx = _findNisIndex(header);
    final cardIdx = _findCardNumberIndex(header);

    if (nisIdx < 0 || cardIdx < 0) {
      throw Exception(
        'Header file harus mengandung kolom: NIS dan card_number',
      );
    }

    final rows = <Map<String, String>>[];
    for (int i = 1; i < lines.length; i++) {
      final cols = lines[i].split(',').map((c) => c.trim()).toList();
      if (cols.length <= nisIdx || cols.length <= cardIdx) continue;
      final nis = cols[nisIdx];
      final cardNo = cols[cardIdx];
      if (nis.isEmpty || cardNo.isEmpty) continue;
      rows.add({'nis': nis, 'cardNo': cardNo});
    }

    return rows;
  }

  Future<List<Map<String, String>>> _parseXlsxRows(String filePath) async {
    final bytes = await File(filePath).readAsBytes();
    final excel = xls.Excel.decodeBytes(bytes);
    if (excel.tables.isEmpty) {
      throw Exception('File XLSX tidak memiliki sheet');
    }

    final sheet = excel.tables.values.first;
    final allRows = sheet.rows;
    if (allRows.length < 2) {
      throw Exception('File XLSX kosong atau hanya header');
    }

    final header = allRows.first
        .map((cell) => _cellText(cell).toLowerCase())
        .toList();

    final nisIdx = _findNisIndex(header);
    final cardIdx = _findCardNumberIndex(header);

    if (nisIdx < 0 || cardIdx < 0) {
      throw Exception(
        'Header file harus mengandung kolom: NIS dan card_number',
      );
    }

    final rows = <Map<String, String>>[];
    for (int i = 1; i < allRows.length; i++) {
      final row = allRows[i];
      if (row.length <= nisIdx || row.length <= cardIdx) continue;

      final nis = _normalizeNumericLike(_cellText(row[nisIdx]));
      final cardNo = _normalizeNumericLike(_cellText(row[cardIdx]));
      if (nis.isEmpty || cardNo.isEmpty) continue;
      rows.add({'nis': nis, 'cardNo': cardNo});
    }

    return rows;
  }

  int _findNisIndex(List<String> header) {
    return header.indexWhere((h) => h == 'nis');
  }

  int _findCardNumberIndex(List<String> header) {
    return header.indexWhere(
      (h) =>
          h == 'card_number' ||
          h == 'cardno' ||
          h == 'card_no' ||
          h == 'card number' ||
          h == 'cardid' ||
          h == 'card_id',
    );
  }

  String _cellText(dynamic cell) {
    final rawValue = cell?.value;
    if (rawValue == null) return '';

    var text = rawValue.toString().trim();

    // excel 4.x may stringify as TextCellValue(foo) / IntCellValue(123) etc.
    final wrapped = RegExp(r'^[A-Za-z]+CellValue\((.*)\)$').firstMatch(text);
    if (wrapped != null) {
      text = wrapped.group(1)?.trim() ?? '';
    }

    // Handle forms like "value: foo" or quoted wrappers.
    if (text.startsWith('value:')) {
      text = text.substring(6).trim();
    }
    if ((text.startsWith('"') && text.endsWith('"')) ||
        (text.startsWith("'") && text.endsWith("'"))) {
      text = text.substring(1, text.length - 1).trim();
    }

    return text;
  }

  String _normalizeNumericLike(String value) {
    final v = value.trim();
    if (v.endsWith('.0')) {
      return v.substring(0, v.length - 2);
    }
    return v;
  }

  Future<bool?> _showImportInstructionDialog() async {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Instruksi Import Kartu'),
        content: SizedBox(
          width: 760,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Pastikan file berformat CSV dengan header:'),
                SizedBox(height: 6),
                Text('1. NIS'),
                Text('2. card_number'),
                SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.all(Radius.circular(8)),
                  child: Image(
                    image: AssetImage('lib/ui/asset/INSTRUKSI.jpg'),
                    fit: BoxFit.contain,
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Lanjut Pilih File'),
          ),
        ],
      ),
    );
  }

  void _showCardOptions(Student student) {
    showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: Text('Kartu ${student.cardNo}'),
        children: [
          SimpleDialogOption(
            onPressed: () {
              Navigator.pop(ctx);
              _removeCard(student).then((__) {
                if (mounted) _assignCard(student);
              });
            },
            child: const ListTile(
              leading: Icon(Icons.swap_horiz),
              title: Text('Ganti Kartu'),
              contentPadding: EdgeInsets.zero,
            ),
          ),
          SimpleDialogOption(
            onPressed: () {
              Navigator.pop(ctx);
              _removeCard(student);
            },
            child: const ListTile(
              leading: Icon(Icons.delete_outline, color: Colors.red),
              title: Text('Hapus Kartu', style: TextStyle(color: Colors.red)),
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ],
      ),
    );
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _probeBackendReady({bool force = false}) async {
    final now = DateTime.now();
    if (!force && _lastBackendProbeAt != null) {
      if (now.difference(_lastBackendProbeAt!) < const Duration(seconds: 3)) {
        return;
      }
    }

    final config = ref.read(configProvider).asData?.value;
    if (config == null || !config.isServerConfigured) {
      _lastBackendProbeAt = now;
      if (mounted && _backendReady) {
        setState(() => _backendReady = false);
      }
      return;
    }

    final result = await ServerService.testConnection(
      config.serverUrl,
      config.apiKey,
    );
    _lastBackendProbeAt = DateTime.now();
    if (!mounted) return;
    if (_backendReady != result.success) {
      setState(() => _backendReady = result.success);
    }
  }

  Future<bool> _ensureOperationalReady() async {
    final config = ref.read(configProvider).asData?.value;
    if (config == null || !config.isHikvisionConfigured) {
      _showSnack('Konfigurasi Hikvision belum lengkap');
      return false;
    }

    final status = ref.read(hikvisionServiceProvider).currentStatus;
    if (status != AlertStreamStatus.connected) {
      _showSnack('Reader Hikvision belum terhubung. Cek perangkat dulu.');
      return false;
    }
    if (!config.isServerConfigured) {
      _showSnack('Konfigurasi backend belum lengkap.');
      return false;
    }

    final result = await ServerService.testConnection(
      config.serverUrl,
      config.apiKey,
    );
    if (!mounted) return false;
    if (_backendReady != result.success) {
      setState(() => _backendReady = result.success);
    }
    if (!result.success) {
      _showSnack('Pastikan terkoneksi ke backend/websocket dulu.');
      return false;
    }

    return true;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final syncState = ref.watch(studentSyncProvider);
    final hikReady = ref.watch(hikvisionReadyProvider);
    final operationReady = hikReady && _backendReady;

    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.fromLTRB(24, 20, 16, 12),
          decoration: BoxDecoration(
            color: colors.surface,
            border: Border(
              bottom: BorderSide(color: colors.outlineVariant, width: 1),
            ),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Icon(Icons.people, color: colors.primary, size: 24),
                  const SizedBox(width: 10),
                  Text(
                    'Daftar Siswa',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${_filtered.length} siswa',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.outline,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: (operationReady ? Colors.green : Colors.red)
                          .withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      operationReady
                          ? 'Hikvision Reader ON'
                          : 'Hikvision Reader OFF',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: operationReady
                            ? Colors.green.shade700
                            : Colors.red.shade700,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: operationReady ? _importCardsCsv : null,
                    icon: const Icon(Icons.file_upload_outlined, size: 18),
                    label: const Text('Import data kartu via file'),
                  ),
                  const SizedBox(width: 4),
                  IconButton(
                    icon: const Icon(Icons.upload, size: 20),
                    onPressed: operationReady ? _pushAllToHikvision : null,
                    tooltip: 'Push semua ke Hikvision',
                  ),
                  const SizedBox(width: 4),
                  syncState.when(
                    data: (s) => s.syncing
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const SizedBox.shrink(),
                    loading: () => const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    error: (_, __) => const Icon(
                      Icons.sync_problem,
                      size: 20,
                      color: Colors.red,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _searchCtrl,
                decoration: InputDecoration(
                  hintText: 'Cari nama, NIS, kelas...',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: colors.outlineVariant),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: colors.outlineVariant),
                  ),
                  filled: true,
                  fillColor: colors.surfaceContainerLow,
                ),
              ),
            ],
          ),
        ),

        // Body
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _filtered.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.person_off,
                        size: 56,
                        color: colors.outlineVariant,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _students.isEmpty
                            ? 'Belum ada data siswa'
                            : 'Tidak ditemukan',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: colors.outline,
                        ),
                      ),
                      if (_students.isEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Sinkronisasi berjalan otomatis dari server',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colors.outlineVariant,
                          ),
                        ),
                      ],
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  itemCount: _filtered.length,
                  itemBuilder: (context, index) {
                    final s = _filtered[index];
                    return Card(
                      elevation: 0,
                      margin: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        side: BorderSide(
                          color: colors.outlineVariant.withOpacity(0.5),
                        ),
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: colors.primaryContainer.withOpacity(
                            0.5,
                          ),
                          child: Text(
                            s.nama.isNotEmpty ? s.nama[0].toUpperCase() : '?',
                            style: TextStyle(
                              color: colors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        title: Text(
                          s.nama,
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                        subtitle: Text(
                          [
                            if (s.nis != null) 'NIS: ${s.nis}',
                            if (s.kelas != null) s.kelas,
                          ].join(' · '),
                          style: TextStyle(
                            color: colors.onSurfaceVariant,
                            fontSize: 12,
                          ),
                        ),
                        trailing: s.cardNo != null
                            ? Chip(
                                label: Text(
                                  s.cardNo!,
                                  style: const TextStyle(fontSize: 11),
                                ),
                                avatar: const Icon(Icons.contactless, size: 14),
                                visualDensity: VisualDensity.compact,
                                padding: EdgeInsets.zero,
                                deleteIcon: const Icon(Icons.close, size: 14),
                                onDeleted: operationReady
                                    ? () => _showCardOptions(s)
                                    : null,
                              )
                            : Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (!s.hikRegistered)
                                    IconButton(
                                      icon: Icon(
                                        Icons.upload,
                                        size: 18,
                                        color: colors.outline,
                                      ),
                                      tooltip: 'Masukan nama ke  Hikvision',
                                      onPressed: operationReady
                                          ? () => _pushOneToHikvision(s)
                                          : null,
                                    ),
                                  IconButton(
                                    icon: Icon(
                                      Icons.add_card,
                                      color: colors.primary,
                                    ),
                                    tooltip: 'Assign kartu',
                                    onPressed: operationReady
                                        ? () => _assignCard(s)
                                        : null,
                                  ),
                                ],
                              ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
