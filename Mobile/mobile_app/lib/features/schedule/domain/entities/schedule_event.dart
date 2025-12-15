import 'package:equatable/equatable.dart';

enum ScheduleType { fixed, offset, test, supplementary, workShift }

class ScheduleEvent extends Equatable {
  final String id;
  final String title; // ClassName or Shift Name
  final DateTime date;
  final String startTime;
  final String endTime;
  final ScheduleType type;
  final String? notes;
  final String? meetingLink;
  final String subject;
  final bool isOnLeave;

  const ScheduleEvent({
    required this.id,
    required this.title,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.type,
    this.notes,
    this.meetingLink,
    required this.subject,
    this.isOnLeave = false,
  });

  @override
  List<Object?> get props => [
        id,
        title,
        date,
        startTime,
        endTime,
        type,
        notes,
        meetingLink,
        subject,
        isOnLeave
      ];
}
