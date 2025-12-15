import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/leave_request.dart';

abstract class LeaveRepository {
  Future<Either<Failure, List<LeaveRequest>>> getLeaveRequests();
  Future<Either<Failure, LeaveRequest>> createLeaveRequest({
    required String fixedScheduleId,
    required DateTime date,
    required String reason,
  });
}
