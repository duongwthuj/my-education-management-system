import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/schedule_event.dart';
import '../repositories/schedule_repository.dart';

class GetMySchedule implements UseCase<List<ScheduleEvent>, GetMyScheduleParams> {
  final ScheduleRepository repository;

  GetMySchedule(this.repository);

  @override
  Future<Either<Failure, List<ScheduleEvent>>> call(GetMyScheduleParams params) async {
    return await repository.getMySchedule(
      startDate: params.startDate,
      endDate: params.endDate,
    );
  }
}

class GetMyScheduleParams extends Equatable {
  final DateTime startDate;
  final DateTime endDate;

  const GetMyScheduleParams({required this.startDate, required this.endDate});

  @override
  List<Object> get props => [startDate, endDate];
}
