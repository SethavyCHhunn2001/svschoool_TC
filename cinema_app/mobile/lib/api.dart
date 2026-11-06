import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  const ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://cinema-api.example.invalid/api',
  );
  static const _tokenKey = 'cinema_auth_token';

  final http.Client _client;
  String? _token;

  String? get token => _token;

  Future<void> restoreToken() async {
    _token = (await SharedPreferences.getInstance()).getString(_tokenKey);
  }

  Future<void> setToken(String token) async {
    _token = token;
    await (await SharedPreferences.getInstance()).setString(_tokenKey, token);
  }

  Future<void> clearToken() async {
    _token = null;
    await (await SharedPreferences.getInstance()).remove(_tokenKey);
  }

  Future<Map<String, dynamic>> get(String path) => _send('GET', path);

  Future<Map<String, dynamic>> post(
    String path, [
    Map<String, dynamic>? body,
  ]) => _send('POST', path, body: body);

  Future<Map<String, dynamic>> put(String path, Map<String, dynamic> body) =>
      _send('PUT', path, body: body);

  Future<Map<String, dynamic>> delete(String path) => _send('DELETE', path);

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{'Accept': 'application/json'};
    if (body != null) headers['Content-Type'] = 'application/json';
    if (_token != null) headers['Authorization'] = 'Bearer $_token';

    try {
      final request = http.Request(method, uri)..headers.addAll(headers);
      if (body != null) request.body = jsonEncode(body);
      final streamed = await _client.send(request);
      final response = await http.Response.fromStream(streamed);
      final decoded = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final message = decoded['error'] as String? ?? 'Request failed.';
        throw ApiException(message, statusCode: response.statusCode);
      }
      return decoded;
    } on http.ClientException {
      throw const ApiException(
        'Could not reach the cinema server. Check your connection and API URL.',
      );
    }
  }
}
