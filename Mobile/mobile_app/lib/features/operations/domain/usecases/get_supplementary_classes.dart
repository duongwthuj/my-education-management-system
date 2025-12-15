import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/supplementary_class.dart';
import '../repositories/operations_repository.dart';

class GetSupplementaryClasses implements UseCase<List<SupplementaryClass>, NoParams> {
  final OperationsRepository repository;

  GetSupplementaryClasses(this.repository);

  @override
  Future<Either<Failure, List<SupplementaryClass>>> call(NoParams params) async {
    return await repository.getSupplementaryClasses();
  }
}
