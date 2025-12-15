import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/leave_request.dart';
import '../repositories/leave_repository.dart';

class CreateLeaveRequest implements UseCase<LeaveRequest, CreateLeaveRequestParams> {
  final LeaveRepository repository;

  CreateLeaveRequest(this.repository);

  @override
  Future<Either<Failure, LeaveRequest>> call(CreateLeaveRequestParams params) async {
    return await repository.createLeaveRequest(
      fixedScheduleId: params.fixedScheduleId,
      date: params.date,
      reason: params.reason,
    );
  }
}

class CreateLeaveRequestParams extends Equatable {
  final String fixedScheduleId;
  final DateTime date;
  final String reason;

  const CreateLeaveRequestParams({
    required this.fixedScheduleId,
    required this.date,
    required this.reason,
  });

  @override
  List<Object> get props => [fixedScheduleId, date, reason];
}
