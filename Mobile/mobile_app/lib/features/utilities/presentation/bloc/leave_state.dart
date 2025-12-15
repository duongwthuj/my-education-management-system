import 'package:equatable/equatable.dart';
import '../../domain/entities/leave_request.dart';

abstract class LeaveState extends Equatable {
  const LeaveState();
  @override
  List<Object> get props => [];
}

class LeaveInitial extends LeaveState {}

class LeaveLoading extends LeaveState {}

class LeaveLoaded extends LeaveState {
  final List<LeaveRequest> requests;

  const LeaveLoaded(this.requests);

  @override
  List<Object> get props => [requests];
}

class LeaveOperationSuccess extends LeaveState {
  final String message;
  const LeaveOperationSuccess(this.message);
   @override
  List<Object> get props => [message];
}

class LeaveError extends LeaveState {
  final String message;
  const LeaveError(this.message);
  @override
  List<Object> get props => [message];
}
