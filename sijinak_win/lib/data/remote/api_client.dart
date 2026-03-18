import 'dart:convert';
import 'dart:io';

import '../../config/app_config.dart';

class ApiClient {
  final String baseUrl;
  final String apiKey;

  ApiClient({required String baseUrl, required this.apiKey})
      : baseUrl = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;

  factory ApiClient.fromConfig(AppConfig config) =>
      ApiClient(baseUrl: config.serverUrl, apiKey: config.apiKey);

  Future<void> testConnection() async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 10);
    final url = '$baseUrl/api/desktop/ping';
    print('[ApiClient] Testing connection to: $url');
    print('[ApiClient] Using X-API-Key: ${apiKey.length > 5 ? "${apiKey.substring(0, 5)}***" : "***"}');
    
    try {
      final request = await client.getUrl(Uri.parse(url));
      request.headers.set('X-API-Key', apiKey);
      
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      print('[ApiClient] Response Status: ${response.statusCode}');
      print('[ApiClient] Response Body: $body');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw ApiException('Invalid API key', response.statusCode);
      }
      if (response.statusCode != 200) {
        throw ApiException('Server responded with ${response.statusCode}: $body', response.statusCode);
      }
    } catch (e) {
      print('[ApiClient] Connection test failed: $e');
      rethrow;
    } finally {
      client.close();
    }
  }

  Future<List<Map<String, dynamic>>> fetchStudents() async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 15);
    final url = '$baseUrl/api/desktop/students';
    print('[ApiClient] Fetching students from: $url');
    
    try {
      final request = await client.getUrl(Uri.parse(url));
      request.headers.set('X-API-Key', apiKey);
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw ApiException('Invalid API key', response.statusCode);
      }
      if (response.statusCode != 200) {
        throw ApiException('HTTP ${response.statusCode}', response.statusCode);
      }

      final list = jsonDecode(body) as List;
      return list.cast<Map<String, dynamic>>();
    } finally {
      client.close();
    }
  }

  Future<List<Map<String, dynamic>>> syncAttendance(List<Map<String, dynamic>> events) async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 30);
    final url = '$baseUrl/api/desktop/sync-attendance';
    print('[ApiClient] Syncing ${events.length} events to: $url');
    
    try {
      final request = await client.postUrl(Uri.parse(url));
      request.headers.set('X-API-Key', apiKey);
      request.headers.set('Content-Type', 'application/json');
      
      final body = jsonEncode({'events': events});
      request.add(utf8.encode(body));
      
      final response = await request.close();
      final responseBody = await response.transform(utf8.decoder).join();
      print('[ApiClient] Sync Response Status: ${response.statusCode}');

      if (response.statusCode != 200) {
        throw ApiException('HTTP ${response.statusCode}: $responseBody', response.statusCode);
      }

      final data = jsonDecode(responseBody) as Map<String, dynamic>;
      return (data['results'] as List).cast<Map<String, dynamic>>();
    } finally {
      client.close();
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException($statusCode): $message';
}
