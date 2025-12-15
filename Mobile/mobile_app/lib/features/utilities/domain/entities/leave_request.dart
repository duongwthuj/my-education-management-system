import 'package:equatable/equatable.dart';

class LeaveRequest extends Equatable {
  final String id;
  final String fixedScheduleId;
  final String teacherId;
  final DateTime date;
  final String reason;
  final String? substituteTeacherId;
  final DateTime createdAt;

  const LeaveRequest({
    required this.id,
    required this.fixedScheduleId,
    required this.teacherId,
    required this.date,
    required this.reason,
    this.substituteTeacherId,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, fixedScheduleId, teacherId, date, reason, substituteTeacherId, createdAt];
}
