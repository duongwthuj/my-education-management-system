import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class Register implements UseCase<User, RegisterParams> {
  final AuthRepository repository;

  Register(this.repository);

  @override
  Future<Either<Failure, User>> call(RegisterParams params) async {
    return await repository.register(
      username: params.username,
      password: params.password,
      name: params.name,
      email: params.email,
      phone: params.phone,
      dateOfBirth: params.dateOfBirth,
    );
  }
}

class RegisterParams extends Equatable {
  final String username;
  final String password;
  final String name;
  final String email;
  final String phone;
  final String dateOfBirth;

  const RegisterParams({
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
