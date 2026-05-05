import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

Map<String, String> _parseEnvFile(String content) {
  final result = <String, String>{};
  for (final line in content.split('\n')) {
    final trimmed = line.trim();
    if (trimmed.isEmpty || trimmed.startsWith('#')) continue;
    final idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    final key = trimmed.substring(0, idx).trim();
    final value = trimmed.substring(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

Future<Map<String, String>> _loadEnv() async {
  final candidates = [
    File(p.join(p.dirname(Platform.resolvedExecutable), '.env')),
    File('.env'),
  ];
  for (final f in candidates) {
    if (await f.exists()) return _parseEnvFile(await f.readAsString());
  }
  return {};
}

class AppConfig {
  String hikvisionIp;
  String hikvisionUser;
  String hikvisionPassword;
  String hikvisionMac;
  String serverUrl;
  String apiKey;
  String wablasBaseUrl;
  String wablasApiKey;
  String wablasSecKey;
  String thermalPrinterKey;
  String thermalPrinterName;

  AppConfig({
    this.hikvisionIp = '192.168.40.181',
    this.hikvisionUser = 'admin',
    this.hikvisionPassword = '',
    this.hikvisionMac = '4c:24:ce:99:a0:aa',
    this.serverUrl = 'http://localhost:2385',
    this.apiKey = '',
    this.wablasBaseUrl = 'https://jogja.wablas.com',
    this.wablasApiKey = '',
    this.wablasSecKey = '',
    this.thermalPrinterKey = '',
    this.thermalPrinterName = '',
  });

  String get hikvisionBaseUrl => 'http://$hikvisionIp';

  bool get isHikvisionConfigured =>
      hikvisionIp.isNotEmpty && hikvisionPassword.isNotEmpty;

  bool get isServerConfigured =>
      serverUrl.isNotEmpty && apiKey.isNotEmpty;

  bool get isWablasConfigured =>
      wablasBaseUrl.isNotEmpty &&
      wablasApiKey.isNotEmpty &&
      wablasSecKey.isNotEmpty;

  static Future<File> get _configFile async {
    final dir = await getApplicationSupportDirectory();
    return File(p.join(dir.path, 'config.json'));
  }

  static Future<AppConfig> load() async {
    final env = await _loadEnv();
    try {
      final file = await _configFile;
      if (await file.exists()) {
        final json = jsonDecode(await file.readAsString()) as Map<String, dynamic>;
        return AppConfig(
          hikvisionIp: json['hikvision_ip'] as String? ?? '192.168.40.181',
          hikvisionUser: json['hikvision_user'] as String? ?? 'admin',
          hikvisionPassword: json['hikvision_password'] as String? ?? env['HIK_PASSWORD'] ?? '',
          hikvisionMac: json['hikvision_mac'] as String? ?? '4c:24:ce:99:a0:aa',
          serverUrl: json['server_url'] as String? ?? 'http://localhost:2385',
          apiKey: json['api_key'] as String? ?? env['DESKTOP_API_KEY'] ?? '',
          wablasBaseUrl: json['wablas_base_url'] as String? ?? env['WABLAS_BASE_URL'] ?? 'https://jogja.wablas.com',
          wablasApiKey: json['wablas_api_key'] as String? ?? env['WABLAS_API_KEY'] ?? '',
          wablasSecKey: json['wablas_sec_key'] as String? ?? env['WABLAS_SEC_KEY'] ?? '',
          thermalPrinterKey: json['thermal_printer_key'] as String? ?? '',
          thermalPrinterName: json['thermal_printer_name'] as String? ?? '',
        );
      }
    } catch (_) {}
    return AppConfig(
      hikvisionPassword: env['HIK_PASSWORD'] ?? '',
      apiKey: env['DESKTOP_API_KEY'] ?? '',
      wablasBaseUrl: env['WABLAS_BASE_URL'] ?? 'https://jogja.wablas.com',
      wablasApiKey: env['WABLAS_API_KEY'] ?? '',
      wablasSecKey: env['WABLAS_SEC_KEY'] ?? '',
    );
  }

  Future<void> save() async {
    final file = await _configFile;
    await file.parent.create(recursive: true);
    await file.writeAsString(const JsonEncoder.withIndent('  ').convert({
      'hikvision_ip': hikvisionIp,
      'hikvision_user': hikvisionUser,
      'hikvision_password': hikvisionPassword,
      'hikvision_mac': hikvisionMac,
      'server_url': serverUrl,
      'api_key': apiKey,
      'wablas_base_url': wablasBaseUrl,
      'wablas_api_key': wablasApiKey,
      'wablas_sec_key': wablasSecKey,
      'thermal_printer_key': thermalPrinterKey,
      'thermal_printer_name': thermalPrinterName,
    }));
  }
}
