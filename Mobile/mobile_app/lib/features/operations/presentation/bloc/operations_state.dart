import 'package:equatable/equatable.dart';
import '../../domain/entities/offset_class.dart';
import '../../domain/entities/supplementary_class.dart';

abstract class OperationsState extends Equatable {
  const OperationsState();
  @override
  List<Object> get props => [];
}

class OperationsInitial extends OperationsState {}

class OperationsLoading extends OperationsState {}

class OperationsLoaded extends OperationsState {
  final List<OffsetClass> offsetClasses;
  final List<SupplementaryClass> supplementaryClasses;

  const OperationsLoaded({
    required this.offsetClasses,
    required this.supplementaryClasses,
  });

  @override
  List<Object> get props => [offsetClasses, supplementaryClasses];
}

class OperationsError extends OperationsState {
  final String message;
  const OperationsError(this.message);
  @override
  List<Object> get props => [message];
}
