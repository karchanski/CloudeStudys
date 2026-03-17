import 'package:flutter/material.dart';

class AuthProvider extends ChangeNotifier {
  bool _isLoggedIn = false;
  String _token = '';

  bool get isLoggedIn => _isLoggedIn;
  String get token => _token;

  Future<void> login(String email, String password) async {
    _token = 'demo-token';
    _isLoggedIn = true;
    notifyListeners();
  }

  void logout() {
    _token = '';
    _isLoggedIn = false;
    notifyListeners();
  }
}
