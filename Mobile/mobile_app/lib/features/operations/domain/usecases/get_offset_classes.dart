import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/offset_class.dart';
import '../repositories/operations_repository.dart';

class GetOffsetClasses implements UseCase<List<OffsetClass>, NoParams> {
  final OperationsRepository repository;

  GetOffsetClasses(this.repository);

  @override
  Future<Either<Failure, List<OffsetClass>>> call(NoParams params) async {
    return await repository.getOffsetClasses();
  }
}
