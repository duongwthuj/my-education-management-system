import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/leave_request.dart';
import '../repositories/leave_repository.dart';

class GetLeaveRequests implements UseCase<List<LeaveRequest>, NoParams> {
  final LeaveRepository repository;

  GetLeaveRequests(this.repository);

  @override
  Future<Either<Failure, List<LeaveRequest>>> call(NoParams params) async {
    return await repository.getLeaveRequests();
  }
}
