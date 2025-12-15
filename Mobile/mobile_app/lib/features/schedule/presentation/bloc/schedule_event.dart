import 'package:equatable/equatable.dart';

abstract class ScheduleBlocEvent extends Equatable {
  const ScheduleBlocEvent();

  @override
  List<Object> get props => [];
}

class LoadSchedule extends ScheduleBlocEvent {
  final DateTime date;

  const LoadSchedule(this.date);

  @override
  List<Object> get props => [date];
}
