import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/usecases/create_leave_request.dart';
import '../../domain/usecases/get_leave_requests.dart';
import 'leave_event.dart';
import 'leave_state.dart';

class LeaveBloc extends Bloc<LeaveEvent, LeaveState> {
  final GetLeaveRequests getLeaveRequests;
  final CreateLeaveRequest createLeaveRequest;

  LeaveBloc({
    required this.getLeaveRequests,
    required this.createLeaveRequest,
  }) : super(LeaveInitial()) {
    on<LoadLeaveRequests>(_onLoadLeaveRequests);
    on<CreateLeaveRequestEvent>(_onCreateLeaveRequest);
  }

  Future<void> _onLoadLeaveRequests(
    LoadLeaveRequests event,
    Emitter<LeaveState> emit,
  ) async {
    emit(LeaveLoading());
    final result = await getLeaveRequests(NoParams());
    result.fold(
      (failure) => emit(LeaveError(failure.message)),
      (requests) => emit(LeaveLoaded(requests)),
    );
  }

  Future<void> _onCreateLeaveRequest(
    CreateLeaveRequestEvent event,
    Emitter<LeaveState> emit,
  ) async {
    emit(LeaveLoading());
    final result = await createLeaveRequest(CreateLeaveRequestParams(
      fixedScheduleId: event.fixedScheduleId,
      date: event.date,
      reason: event.reason,
    ));
    
    result.fold(
      (failure) => emit(LeaveError(failure.message)),
      (success) {
        emit(const LeaveOperationSuccess('Created leave request successfully'));
        add(LoadLeaveRequests()); // Refresh list
      },
    );
  }
}
