import 'package:equatable/equatable.dart';

class DashboardStats extends Equatable {
  final double hoursMonth;
  final double testHours;
  final int supplementaryCount;
  final int upcomingCount;
  final List<DashboardClass> upcomingClasses;

  const DashboardStats({
    required this.hoursMonth,
    required this.testHours,
    required this.supplementaryCount,
    required this.upcomingCount,
    required this.upcomingClasses,
  });

  @override
  List<Object> get props => [hoursMonth, testHours, supplementaryCount, upcomingCount, upcomingClasses];
}

class DashboardClass extends Equatable {
  final String id;
  final String className;
  final String subject;
  final String date;
  final String time;
  final String type; // Fixed, Offset, Test, Supplementary

  const DashboardClass({
    required this.id,
    required this.className,
    required this.subject,
    required this.date,
    required this.time,
    required this.type,
  });

  @override
  List<Object> get props => [id, className, subject, date, time, type];
}
