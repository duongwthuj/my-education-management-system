import 'package:dio/dio.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/data/models/user_model.dart';
import '../../domain/entities/profile.dart';

abstract class ProfileRemoteDataSource {
  Future<Profile> getProfile();
}

class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final ApiClient apiClient;

  ProfileRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<Profile> getProfile() async {
    try {
      // 1. Get User Info (/auth/me)
      final meResponse = await apiClient.dio.get('/auth/me');
      final userModel = UserModel.fromJson(meResponse.data);

      Map<String, dynamic>? teacherDetails;

      // 2. Check if user is linked to a teacher profile
      // Accessing the raw JSON to check for teacherId object/string
      // Based on Web code: meRes.data.teacherId?._id
      // The backend likely returns teacherId populated or as ID string.
      
      String? teacherId;
      if (meResponse.data['teacherId'] != null) {
        if (meResponse.data['teacherId'] is Map) {
           teacherId = meResponse.data['teacherId']['_id'];
        } else if (meResponse.data['teacherId'] is String) {
           teacherId = meResponse.data['teacherId'];
        }
      }

      if (teacherId != null) {
        try {
           final teacherResponse = await apiClient.dio.get('/teachers/$teacherId/details');
           teacherDetails = teacherResponse.data['data']; // Assuming response format { success: true, data: { ... } }
           // OR /teachers/:id might just return object or array. 
           // Web code used: teachersAPI.getDetails(teacherId) -> /teachers/:id/details
        } catch (e) {
          // If fetching details fails, we still return the user profile, just without details
          // Or we can throw error if strict.
          print("Failed to fetch teacher details: $e");
        }
      }

      return Profile(user: userModel, teacherDetails: teacherDetails);

    } on DioException catch (e) {
      throw ServerFailure(e.response?.data['message'] ?? e.message ?? 'Unknown Error');
    }
  }
}
