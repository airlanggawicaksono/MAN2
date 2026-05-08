import 'dart:convert';
import 'dart:io';

import '../../config/app_config.dart';
import 'dto/student_sync_response_dto.dart';

abstract class BackendApiPort {
  Future<void> testConnection();
  Future<List<StudentSyncResponseDTO>> fetchStudents();
  Future<List<Map<String, dynamic>>> syncAttendance(
    List<Map<String, dynamic>> events,
  );
  Future<void> assignStudentCard(String userId, String rfidNumber);
  Future<String?> replaceStudentCard(String userId, String newCardNo);
  Future<String?> removeStudentCard(String userId);
}

class ApiClient implements BackendApiPort {
  final String baseUrl;
  final String apiKey;

  ApiClient({required String baseUrl, required this.apiKey})
    : baseUrl = baseUrl.endsWith('/')
          ? baseUrl.substring(0, baseUrl.length - 1)
          : baseUrl;

  factory ApiClient.fromConfig(AppConfig config) =>
      ApiClient(baseUrl: config.serverUrl, apiKey: config.apiKey);

  @override
  Future<void> testConnection() async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 10);
    final url = '$baseUrl/api/desktop/ping';

    try {
      final request = await client.getUrl(Uri.parse(url));
      request.headers.set('X-API-Key', apiKey);

      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw ApiException('Invalid API key', response.statusCode);
      }
      if (response.statusCode != 200) {
        throw ApiException(
          'Server responded with ${response.statusCode}: $body',
          response.statusCode,
        );
      }
    } catch (e) {
      rethrow;
    } finally {
      client.close();
    }
  }

  @override
  Future<List<StudentSyncResponseDTO>> fetchStudents() async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 15);
    final url = '$baseUrl/api/desktop/students';

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
      return list
          .cast<Map<String, dynamic>>()
          .map(StudentSyncResponseDTO.fromJson)
          .toList();
    } finally {
      client.close();
    }
  }

  @override
  Future<List<Map<String, dynamic>>> syncAttendance(
    List<Map<String, dynamic>> events,
  ) async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 30);
    final url = '$baseUrl/api/desktop/sync-attendance';

    try {
      final request = await client.postUrl(Uri.parse(url));
      request.headers.set('X-API-Key', apiKey);
      request.headers.set('Content-Type', 'application/json');

      final body = jsonEncode({'events': events});
      request.add(utf8.encode(body));

      final response = await request.close();
      final responseBody = await response.transform(utf8.decoder).join();

      if (response.statusCode != 200) {
        throw ApiException(
          'HTTP ${response.statusCode}: $responseBody',
          response.statusCode,
        );
      }

      final data = jsonDecode(responseBody) as Map<String, dynamic>;
      return (data['results'] as List).cast<Map<String, dynamic>>();
    } finally {
      client.close();
    }
  }

  @override
  Future<String?> removeStudentCard(String userId) async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 15);
    final url = '$baseUrl/api/desktop/students/$userId/card';

    try {
      final request = await client.deleteUrl(Uri.parse(url));
      request.headers.set('X-API-Key', apiKey);
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw ApiException('Invalid API key', response.statusCode);
      }
      if (response.statusCode == 404) {
        throw ApiException('Siswa tidak ditemukan', response.statusCode);
      }
      if (response.statusCode != 200) {
        throw ApiException('HTTP ${response.statusCode}: $body', response.statusCode);
      }

      final decoded = jsonDecode(body) as Map<String, dynamic>;
      return decoded['old_rfid_number'] as String?;
    } finally {
      client.close();
    }
  }

  @override
  Future<String?> replaceStudentCard(String userId, String newCardNo) async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 15);
    final url = '$baseUrl/api/desktop/students/$userId/card-replace';

    try {
      final request = await client.postUrl(Uri.parse(url));
      request.headers.set('X-API-Key', apiKey);
      request.headers.set('Content-Type', 'application/json');
      request.add(utf8.encode(jsonEncode({'rfid_number': newCardNo})));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw ApiException('Invalid API key', response.statusCode);
      }
      if (response.statusCode == 404) {
        throw ApiException('Siswa tidak ditemukan', response.statusCode);
      }
      if (response.statusCode == 409) {
        final decoded = jsonDecode(body);
        throw ApiException(decoded['detail'] ?? 'Kartu sudah dipakai', response.statusCode);
      }
      if (response.statusCode != 200) {
        throw ApiException('HTTP ${response.statusCode}: $body', response.statusCode);
      }

      final decoded = jsonDecode(body) as Map<String, dynamic>;
      return decoded['old_rfid_number'] as String?;
    } finally {
      client.close();
    }
  }

  @override
  Future<void> assignStudentCard(String userId, String rfidNumber) async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 15);
    final url = '$baseUrl/api/desktop/students/$userId/card-assign';

    try {
      final request = await client.postUrl(Uri.parse(url));
      request.headers.set('X-API-Key', apiKey);
      request.headers.set('Content-Type', 'application/json');
      request.add(utf8.encode(jsonEncode({'rfid_number': rfidNumber})));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw ApiException('Invalid API key', response.statusCode);
      }
      if (response.statusCode == 404) {
        throw ApiException('Siswa tidak ditemukan', response.statusCode);
      }
      if (response.statusCode == 409) {
        final decoded = jsonDecode(body);
        throw ApiException(decoded['detail'] ?? 'Kartu sudah dipakai', response.statusCode);
      }
      if (response.statusCode != 204) {
        throw ApiException('HTTP ${response.statusCode}: $body', response.statusCode);
      }
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
