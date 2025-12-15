import 'package:dio/dio.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/user_model.dart';
import '../../../../core/utils/constants.dart';
import '../../../../core/usecases/usecase.dart'; // Just for standard imports if needed, but not used here directly

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String username, String password);
  Future<UserModel> register({
    required String username,
    required String password,
    required String name,
    required String email,
    required String phone,
    required String dateOfBirth,
  });
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;

  AuthRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<UserModel> login(String username, String password) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/login',
        data: {'username': username, 'password': password},
      );
      final userModel = UserModel.fromJson(response.data);
      if (userModel.token.isNotEmpty) {
        await apiClient.storage.write(key: AppConstants.keyToken, value: userModel.token);
      }
      return userModel;
    } on DioException catch (e) {
      throw ServerFailure(e.response?.data['message'] ?? e.message ?? 'Unknown Error');
    }
  }

  @override
  Future<UserModel> register({
    required String username,
    required String password,
    required String name,
    required String email,
    required String phone,
    required String dateOfBirth,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/register',
        data: {
          'username': username,
          'password': password,
          'name': name,
          'email': email,
          'phone': phone,
          'dateOfBirth': dateOfBirth,
          // Default roles are handled by backend
        },
      );
      final userModel = UserModel.fromJson(response.data);
      if (userModel.token.isNotEmpty) {
        await apiClient.storage.write(key: AppConstants.keyToken, value: userModel.token);
      }
      return userModel;
    } on DioException catch (e) {
      throw ServerFailure(e.response?.data['message'] ?? e.message ?? 'Unknown Error');
    }
  }
}
