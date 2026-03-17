import 'package:http/http.dart' as http;

class ApiClient {
  final String baseUrl;

  ApiClient({required this.baseUrl});

  Future<http.Response> getCourses(String token) {
    return http.get(
      Uri.parse('$baseUrl/student/courses'),
      headers: {'Authorization': 'Bearer $token'},
    );
  }
}
