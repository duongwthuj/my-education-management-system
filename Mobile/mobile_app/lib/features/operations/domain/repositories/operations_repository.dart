import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/offset_class.dart';
import '../entities/supplementary_class.dart';

abstract class OperationsRepository {
  Future<Either<Failure, List<OffsetClass>>> getOffsetClasses();
  Future<Either<Failure, List<SupplementaryClass>>> getSupplementaryClasses();
}
