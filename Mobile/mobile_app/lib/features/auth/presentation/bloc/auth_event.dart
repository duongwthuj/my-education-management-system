import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object> get props => [];
}

class LoginSubmitted extends AuthEvent {
  final String username;
  final String password;

  const LoginSubmitted(this.username, this.password);

  @override
  List<Object> get props => [username, password];
}

class RegisterSubmitted extends AuthEvent {
  final String username;
  final String password;
  final String name;
  final String email;
  final String phone;
  final String dateOfBirth;

  const RegisterSubmitted({
    required this.username,
    required this.password,
    required this.name,
    required this.email,
    required this.phone,
    required this.dateOfBirth,
  });

  @override
  List<Object> get props => [username, password, name, email, phone, dateOfBirth];
}
