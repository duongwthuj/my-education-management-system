import 'package:equatable/equatable.dart';

abstract class OperationsEvent extends Equatable {
  const OperationsEvent();
  @override
  List<Object> get props => [];
}

class LoadOperations extends OperationsEvent {}
