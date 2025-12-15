import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/get_my_schedule.dart';
import 'schedule_event.dart';
import 'schedule_state.dart';

class ScheduleBloc extends Bloc<ScheduleBlocEvent, ScheduleState> {
  final GetMySchedule getMySchedule;

  ScheduleBloc({required this.getMySchedule}) : super(ScheduleInitial()) {
    on<LoadSchedule>(_onLoadSchedule);
  }

  Future<void> _onLoadSchedule(
    LoadSchedule event,
    Emitter<ScheduleState> emit,
  ) async {
    emit(ScheduleLoading());
    // Load for larger range to populate calendar dots, e.g., surrounding months.
    // For simplicity, let's load current month +/- 1.
    final start = DateTime(event.date.year, event.date.month - 1, 1);
    final end = DateTime(event.date.year, event.date.month + 2, 0);

    final result = await getMySchedule(GetMyScheduleParams(startDate: start, endDate: end));
    result.fold(
      (failure) => emit(ScheduleError(failure.message)),
      (events) => emit(ScheduleLoaded(events)),
    );
  }
}
