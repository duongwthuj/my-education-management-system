import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/schedule_event.dart';

abstract class ScheduleRepository {
  Future<Either<Failure, List<ScheduleEvent>>> getMySchedule({
    required DateTime startDate,
    required DateTime endDate,
  });
}
