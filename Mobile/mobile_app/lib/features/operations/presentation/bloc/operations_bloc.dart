import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/usecases/get_offset_classes.dart';
import '../../domain/usecases/get_supplementary_classes.dart';
import 'operations_event.dart';
import 'operations_state.dart';

class OperationsBloc extends Bloc<OperationsEvent, OperationsState> {
  final GetOffsetClasses getOffsetClasses;
  final GetSupplementaryClasses getSupplementaryClasses;

  OperationsBloc({
    required this.getOffsetClasses,
    required this.getSupplementaryClasses,
  }) : super(OperationsInitial()) {
    on<LoadOperations>(_onLoadOperations);
  }

  Future<void> _onLoadOperations(
    LoadOperations event,
    Emitter<OperationsState> emit,
  ) async {
    emit(OperationsLoading());
    // Run in parallel
    final results = await Future.wait([
      getOffsetClasses(NoParams()),
      getSupplementaryClasses(NoParams()),
    ]);

    final offsetResult = results[0]; // Either<Failure, List<OffsetClass>>
    final suppResult = results[1]; // Either<Failure, List<SupplementaryClass>>

    // Check failures
    String? errorMessage;
    List<dynamic> offsets = [];
    List<dynamic> supps = [];

    offsetResult.fold(
      (failure) => errorMessage = failure.message,
      (data) => offsets = data as List<dynamic>,
    );

    if (errorMessage != null) {
      emit(OperationsError(errorMessage!));
      return;
    }

    suppResult.fold(
      (failure) => errorMessage = failure.message,
      (data) => supps = data as List<dynamic>,
    );

    if (errorMessage != null) {
      emit(OperationsError(errorMessage!));
      return;
    }

    emit(OperationsLoaded(
      offsetClasses: offsets.cast(),
      supplementaryClasses: supps.cast(),
    ));
  }
}
