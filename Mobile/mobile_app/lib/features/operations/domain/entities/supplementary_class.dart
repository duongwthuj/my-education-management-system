import 'package:equatable/equatable.dart';

class SupplementaryClass extends Equatable {
  final String id;
  final String subjectId;
  final DateTime date;
  final String shift;
  final String reason;
  final String status;
  final String? teacherId;

  const SupplementaryClass({
    required this.id,
    required this.subjectId,
    required this.date,
    required this.shift,
    required this.reason,
    required this.status,
    this.teacherId,
  });

  @override
  List<Object?> get props => [id, subjectId, date, shift, reason, status, teacherId];
}
