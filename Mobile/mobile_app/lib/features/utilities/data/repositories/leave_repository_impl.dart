import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/leave_request.dart';
import '../../domain/repositories/leave_repository.dart';
import '../datasources/leave_remote_data_source.dart';

class LeaveRepositoryImpl implements LeaveRepository {
  final LeaveRemoteDataSource remoteDataSource;

  LeaveRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, List<LeaveRequest>>> getLeaveRequests() async {
    try {
      final result = await remoteDataSource.getLeaveRequests();
      return Right(result);
    } on ServerFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, LeaveRequest>> createLeaveRequest({
    required String fixedScheduleId,
    required DateTime date,
    required String reason,
  }) async {
    try {
      final result = await remoteDataSource.createLeaveRequest(
        fixedScheduleId: fixedScheduleId,
        date: date,
        reason: reason,
      );
      return Right(result);
    } on ServerFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
