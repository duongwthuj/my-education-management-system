import 'package:equatable/equatable.dart';

abstract class LeaveEvent extends Equatable {
  const LeaveEvent();
  @override
  List<Object> get props => [];
}

class LoadLeaveRequests extends LeaveEvent {}

class CreateLeaveRequestEvent extends LeaveEvent {
  final String fixedScheduleId;
  final DateTime date;
  final String reason;

  const CreateLeaveRequestEvent({
    required this.fixedScheduleId,
    required this.date,
    required this.reason,
  });

  @override
  List<Object> get props => [fixedScheduleId, date, reason];
}
