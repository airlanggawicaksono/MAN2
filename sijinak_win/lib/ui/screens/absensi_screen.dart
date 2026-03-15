import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_windows/webview_windows.dart';
import '../../providers/providers.dart';

class AbsensiScreen extends ConsumerStatefulWidget {
  const AbsensiScreen({super.key});

  @override
  ConsumerState<AbsensiScreen> createState() => _AbsensiScreenState();
}

class _AbsensiScreenState extends ConsumerState<AbsensiScreen> {
  final _controller = WebviewController();
  bool _ready = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  Future<void> _initWebView() async {
    try {
      await _controller.initialize();

      final config = ref.read(configProvider).valueOrNull;
      final baseUrl = config?.frontendUrl ?? 'http://localhost:4923';
      await _controller.loadUrl('$baseUrl/absensi');

      if (mounted) setState(() => _ready = true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
        });
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: colors.error),
            const SizedBox(height: 12),
            Text('WebView failed to load',
                style: theme.textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(_error!,
                style:
                    theme.textTheme.bodySmall?.copyWith(color: colors.outline)),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () {
                setState(() => _error = null);
                _initWebView();
              },
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (!_ready) {
      return const Center(child: CircularProgressIndicator());
    }

    return Webview(_controller);
  }
}
