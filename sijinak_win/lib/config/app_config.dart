import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

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
    this.wablasBaseUrl = 'https://wablas.com',
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
    try {
      final file = await _configFile;
      if (await file.exists()) {
        final json = jsonDecode(await file.readAsString()) as Map<String, dynamic>;
        return AppConfig(
          hikvisionIp: json['hikvision_ip'] as String? ?? '192.168.40.181',
          hikvisionUser: json['hikvision_user'] as String? ?? 'admin',
          hikvisionPassword: json['hikvision_password'] as String? ?? '',
          hikvisionMac: json['hikvision_mac'] as String? ?? '4c:24:ce:99:a0:aa',
          serverUrl: json['server_url'] as String? ?? 'http://localhost:2385',
          apiKey: json['api_key'] as String? ?? '',
          wablasBaseUrl:
              json['wablas_base_url'] as String? ?? 'https://wablas.com',
          wablasApiKey: json['wablas_api_key'] as String? ?? '',
          wablasSecKey: json['wablas_sec_key'] as String? ?? '',
          thermalPrinterKey: json['thermal_printer_key'] as String? ?? '',
          thermalPrinterName: json['thermal_printer_name'] as String? ?? '',
        );
      }
    } catch (_) {}
    return AppConfig();
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
