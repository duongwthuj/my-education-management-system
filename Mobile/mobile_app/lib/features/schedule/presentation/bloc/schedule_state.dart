import 'package:equatable/equatable.dart';
import '../../domain/entities/schedule_event.dart';

abstract class ScheduleState extends Equatable {
  const ScheduleState();
  
  @override
  List<Object> get props => [];
}

class ScheduleInitial extends ScheduleState {}

class ScheduleLoading extends ScheduleState {}

class ScheduleLoaded extends ScheduleState {
  final List<ScheduleEvent> events;

  const ScheduleLoaded(this.events);

  @override
  List<Object> get props => [events];
}

class ScheduleError extends ScheduleState {
  final String message;

  const ScheduleError(this.message);

  @override
  List<Object> get props => [message];
}
