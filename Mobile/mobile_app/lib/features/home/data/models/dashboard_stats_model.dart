import '../../domain/entities/dashboard_stats.dart';

class DashboardStatsModel extends DashboardStats {
  const DashboardStatsModel({
    required double hoursMonth,
    required double testHours,
    required int supplementaryCount,
    required int upcomingCount,
    required List<DashboardClassModel> upcomingClasses,
  }) : super(
          hoursMonth: hoursMonth,
          testHours: testHours,
          supplementaryCount: supplementaryCount,
          upcomingCount: upcomingCount,
          upcomingClasses: upcomingClasses,
        );

  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) {
    final stats = json['stats'] ?? {};
    final classes = json['upcomingClasses'] as List? ?? [];

    return DashboardStatsModel(
      hoursMonth: (stats['hoursMonth'] as num?)?.toDouble() ?? 0.0,
      testHours: (stats['testHours'] as num?)?.toDouble() ?? 0.0,
      supplementaryCount: (stats['supplementaryCount'] as num?)?.toInt() ?? 0,
      upcomingCount: (stats['upcomingCount'] as num?)?.toInt() ?? 0,
      upcomingClasses: classes
          .map((e) => DashboardClassModel.fromJson(e))
          .toList(),
    );
  }
}

class DashboardClassModel extends DashboardClass {
  const DashboardClassModel({
    required String id,
    required String className,
    required String subject,
    required String date,
    required String time,
    required String type,
  }) : super(
          id: id,
          className: className,
          subject: subject,
          date: date,
          time: time,
          type: type,
        );

  factory DashboardClassModel.fromJson(Map<String, dynamic> json) {
    return DashboardClassModel(
      id: json['_id'] ?? '',
      className: json['className'] ?? 'Unknown Class',
      subject: json['subject'] ?? '',
      date: json['date'] ?? '',
      time: json['time'] ?? '',
      type: json['type'] ?? 'Fixed',
    );
  }
}
