import 'package:dio/dio.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/offset_class.dart';
import '../../domain/entities/supplementary_class.dart';

abstract class OperationsRemoteDataSource {
  Future<List<OffsetClass>> getOffsetClasses();
  Future<List<SupplementaryClass>> getSupplementaryClasses();
}

class OperationsRemoteDataSourceImpl implements OperationsRemoteDataSource {
  final ApiClient apiClient;

  OperationsRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<OffsetClass>> getOffsetClasses() async {
    try {
      final response = await apiClient.dio.get('/offset-class');
      final data = response.data['data'] ?? response.data;
      return (data as List).map((json) => _offsetFromJson(json)).toList();
    } on DioException catch (e) {
      throw ServerFailure(e.response?.data['message'] ?? e.message ?? 'Unknown Error');
    }
  }

  @override
  Future<List<SupplementaryClass>> getSupplementaryClasses() async {
    try {
      final response = await apiClient.dio.get('/supplementary-class');
      final data = response.data['data'] ?? response.data;
      return (data as List).map((json) => _supplementaryFromJson(json)).toList();
    } on DioException catch (e) {
      throw ServerFailure(e.response?.data['message'] ?? e.message ?? 'Unknown Error');
    }
  }

  OffsetClass _offsetFromJson(Map<String, dynamic> json) {
    return OffsetClass(
      id: json['_id'],
      originalClassId: _getId(json['originalClassId']),
      oldDate: json['oldDate'] ?? '',
      oldShift: json['oldShift'] ?? '',
      newDate: DateTime.parse(json['newDate']),
      newShift: json['newShift'] ?? '',
      reason: json['reason'] ?? '',
      status: json['status'] ?? 'Pending',
      teacherId: _getId(json['teacherId']),
    );
  }

  SupplementaryClass _supplementaryFromJson(Map<String, dynamic> json) {
    return SupplementaryClass(
      id: json['_id'],
      subjectId: _getId(json['subjectId']),
      date: DateTime.parse(json['date']),
      shift: json['shift'] ?? '',
      reason: json['reason'] ?? '',
      status: json['status'] ?? 'Pending',
      teacherId: _getId(json['teacherId']),
    );
  }

  String _getId(dynamic field) {
    if (field == null) return '';
    if (field is Map) return field['_id'] ?? '';
    return field.toString();
  }
}
