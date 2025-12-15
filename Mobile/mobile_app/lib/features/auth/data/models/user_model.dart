import '../../domain/entities/user.dart';

class UserModel extends User {
  const UserModel({
    required String id,
    required String username,
    required String role,
    required String token,
  }) : super(id: id, username: username, role: role, token: token);

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '', // Adjust based on actual API response
      username: json['username'] ?? '',
      role: json['role'] ?? '',
      token: json['token'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'role': role,
      'token': token,
    };
  }
}
