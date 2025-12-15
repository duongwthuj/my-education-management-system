import 'package:dio/dio.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/leave_request.dart';

abstract class LeaveRemoteDataSource {
  Future<List<LeaveRequest>> getLeaveRequests();
  Future<LeaveRequest> createLeaveRequest({
    required String fixedScheduleId,
    required DateTime date,
    required String reason,
  });
}

class LeaveRemoteDataSourceImpl implements LeaveRemoteDataSource {
  final ApiClient apiClient;

  LeaveRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<LeaveRequest>> getLeaveRequests() async {
    try {
      final response = await apiClient.dio.get('/fixed-schedule-leaves');
       // The API likely returns a list of leaves
       // Based on dashboard routes, it might be nested
      final data = response.data['data'] ?? response.data;
      return (data as List).map((json) => _fromJson(json)).toList();
    } on DioException catch (e) {
      throw ServerFailure(e.response?.data['message'] ?? e.message ?? 'Unknown Error');
    }
  }

  @override
  Future<LeaveRequest> createLeaveRequest({
    required String fixedScheduleId,
    required DateTime date,
    required String reason,
  }) async {
    try {
      final response = await apiClient.dio.post('/fixed-schedule-leaves', data: {
        'fixedScheduleId': fixedScheduleId,
        'date': date.toIso8601String(),
        'reason': reason,
        // teacherId is likely inferred from token or must be passed if admin
        // Assuming user is teacher context
      });
      final data = response.data['data'] ?? response.data;
      return _fromJson(data);
    } on DioException catch (e) {
      throw ServerFailure(e.response?.data['message'] ?? e.message ?? 'Unknown Error');
    }
  }

  LeaveRequest _fromJson(Map<String, dynamic> json) {
    return LeaveRequest(
      id: json['_id'],
      fixedScheduleId: _getId(json['fixedScheduleId']),
      teacherId: _getId(json['teacherId']),
      date: DateTime.parse(json['date']),
      reason: json['reason'] ?? '',
      substituteTeacherId: json['substituteTeacherId'] != null ? _getId(json['substituteTeacherId']) : null,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  String _getId(dynamic field) {
    if (field is Map) return field['_id'];
    return field.toString();
  }
}
