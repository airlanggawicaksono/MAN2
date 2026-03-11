import 'package:flutter/material.dart';
import '../../data/local/database.dart';
import '../../services/attendance_service.dart';

class TapPopupResult {
  final String eventType; // absen_masuk, absen_keluar, izin
  final String? reason;
  final String? existingRecordId; // If we're overwriting

  const TapPopupResult({
    required this.eventType, 
    this.reason,
    this.existingRecordId,
  });
}

class TapPopupDialog extends StatefulWidget {
  final Student student;
  final AttendanceService attendanceService;

  const TapPopupDialog({
    super.key,
    required this.student,
    required this.attendanceService,
  });

  @override
  State<TapPopupDialog> createState() => _TapPopupDialogState();
}

class _TapPopupDialogState extends State<TapPopupDialog> {
  String? _selected; // No default, force choice
  final _keteranganCtrl = TextEditingController();
  bool _isChecking = false;

  @override
  void dispose() {
    _keteranganCtrl.dispose();
    super.dispose();
  }

  Future<void> _onTypeSelected(String type) async {
    setState(() {
      _selected = type;
      _isChecking = true;
    });

    try {
      final existing = await widget.attendanceService.getExistingTodayRecord(
        widget.student.cardNo ?? '',
        type,
      );

      if (existing != null) {
        final time = DateTime.fromMillisecondsSinceEpoch(existing.deviceTime * 1000);
        final timeStr = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
        
        final label = _getLabel(type);
        final overwrite = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text('Sudah Ada Data $label'),
            content: Text('Anda sudah $label pada pukul $timeStr. Tetap perbarui data ini?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Batal'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Ya, Perbarui'),
              ),
            ],
          ),
        );

        if (overwrite == true) {
          _confirm(existingRecordId: existing.id);
        } else {
          setState(() {
            _selected = null;
            _isChecking = false;
          });
        }
      } else if (type != 'izin') {
        // For non-izin, if no duplicate, just confirm immediately
        _confirm();
      } else {
        // For izin, wait for user to fill reason and click "Simpan"
        setState(() => _isChecking = false);
      }
    } catch (e) {
      setState(() => _isChecking = false);
    }
  }

  void _confirm({String? existingRecordId}) {
    if (_selected == null) return;
    final reason = _selected == 'izin' ? _keteranganCtrl.text.trim() : null;
    Navigator.of(context).pop(TapPopupResult(
      eventType: _selected!, 
      reason: reason,
      existingRecordId: existingRecordId,
    ));
  }

  String _getLabel(String type) {
    if (type == 'absen_masuk') return 'Masuk';
    if (type == 'absen_keluar') return 'Keluar';
    return 'Izin';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final student = widget.student;

    return Dialog(
      elevation: 8,
      shadowColor: Colors.black26,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440),
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Student Header ──────────────────────────────────────
              Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: colors.primaryContainer.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Icon(Icons.person, size: 36, color: colors.primary),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          student.nama,
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: colors.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            [
                              if (student.nis != null) 'NIS: ${student.nis!}',
                              if (student.kelas != null) student.kelas!,
                            ].join(' · '),
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: colors.onSurfaceVariant,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),
              
              if (_isChecking)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: CircularProgressIndicator(strokeWidth: 3),
                  ),
                )
              else ...[
                Text(
                  'PILIH JENIS ABSENSI',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: colors.outline,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 20),
                
                // ── Large Action Cards ──────────────────────────────────
                Row(
                  children: [
                    _ActionButton(
                      label: 'MASUK',
                      icon: Icons.login_rounded,
                      color: Colors.green,
                      selected: _selected == 'absen_masuk',
                      onTap: () => _onTypeSelected('absen_masuk'),
                    ),
                    const SizedBox(width: 12),
                    _ActionButton(
                      label: 'KELUAR',
                      icon: Icons.logout_rounded,
                      color: Colors.blue,
                      selected: _selected == 'absen_keluar',
                      onTap: () => _onTypeSelected('absen_keluar'),
                    ),
                    const SizedBox(width: 12),
                    _ActionButton(
                      label: 'IZIN',
                      icon: Icons.assignment_return_rounded,
                      color: Colors.orange,
                      selected: _selected == 'izin',
                      onTap: () => _onTypeSelected('izin'),
                    ),
                  ],
                ),

                // ── Izin Reason Section ──────────────────────────────────
                AnimatedSize(
                  duration: const Duration(milliseconds: 200),
                  child: _selected == 'izin' 
                    ? Padding(
                        padding: const EdgeInsets.only(top: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            TextField(
                              controller: _keteranganCtrl,
                              autofocus: true,
                              maxLines: 2,
                              decoration: InputDecoration(
                                labelText: 'Alasan Izin Keluar',
                                alignLabelWithHint: true,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                prefixIcon: const Icon(Icons.edit_note),
                              ),
                            ),
                            const SizedBox(height: 16),
                            FilledButton(
                              onPressed: () => _confirm(),
                              style: FilledButton.styleFrom(
                                backgroundColor: Colors.orange.shade700,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: const Text(
                                'SIMPAN IZIN',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      )
                    : const SizedBox.shrink(),
                ),
              ],

              const SizedBox(height: 24),
              TextButton(
                onPressed: () => Navigator.of(context).pop(null),
                style: TextButton.styleFrom(
                  foregroundColor: colors.outline,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('BATAL'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 8),
          decoration: BoxDecoration(
            color: selected ? color.withOpacity(0.15) : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? color : Colors.grey.withOpacity(0.2),
              width: selected ? 3 : 1.5,
            ),
            boxShadow: selected ? [
              BoxShadow(
                color: color.withOpacity(0.2),
                blurRadius: 12,
                offset: const Offset(0, 4),
              )
            ] : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon, 
                color: selected ? color : Colors.grey.shade600, 
                size: 32,
              ),
              const SizedBox(height: 10),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: selected ? color : Colors.grey.shade700,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
