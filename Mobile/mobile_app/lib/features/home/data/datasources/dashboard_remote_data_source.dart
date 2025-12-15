import 'package:dio/dio.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/dashboard_stats_model.dart';

abstract class DashboardRemoteDataSource {
  Future<DashboardStatsModel> getMyStats();
}

class DashboardRemoteDataSourceImpl implements DashboardRemoteDataSource {
  final ApiClient apiClient;

  DashboardRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<DashboardStatsModel> getMyStats() async {
    try {
      final response = await apiClient.dio.get('/dashboard/my-stats');
      // The API returns { success: true, count: X, data: { stats: ..., upcomingClasses: ... } }
      // OR just { stats: ..., upcomingClasses: ... } depending on backend structure.
      // Based on Dashboard.jsx: res.data.data
      
      // If response.data is the full object, and it has a 'data' field:
      // We need to handle how ApiClient might return data.
      // Assuming standard Dio:
      return DashboardStatsModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ServerFailure(e.response?.data['message'] ?? e.message ?? 'Unknown Error');
    }
  }
}
