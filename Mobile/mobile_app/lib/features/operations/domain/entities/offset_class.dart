import 'package:equatable/equatable.dart';

class OffsetClass extends Equatable {
  final String id;
  final String originalClassId;
  final String oldDate;
  final String oldShift; // e.g., "Shift 1"
  final DateTime newDate;
  final String newShift;
  final String reason;
  final String status; // Pending, Approved, Rejected, Cancelled
  final String? teacherId;

  const OffsetClass({
    required this.id,
    required this.originalClassId,
    required this.oldDate,
    required this.oldShift,
    required this.newDate,
    required this.newShift,
    required this.reason,
    required this.status,
    this.teacherId,
  });

  @override
  List<Object?> get props => [id, originalClassId, oldDate, oldShift, newDate, newShift, reason, status, teacherId];
}
