import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/offset_class.dart';
import '../../domain/entities/supplementary_class.dart';
import '../../domain/repositories/operations_repository.dart';
import '../datasources/operations_remote_data_source.dart';

class OperationsRepositoryImpl implements OperationsRepository {
  final OperationsRemoteDataSource remoteDataSource;

  OperationsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, List<OffsetClass>>> getOffsetClasses() async {
    try {
      final result = await remoteDataSource.getOffsetClasses();
      return Right(result);
    } on ServerFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<SupplementaryClass>>> getSupplementaryClasses() async {
    try {
      final result = await remoteDataSource.getSupplementaryClasses();
      return Right(result);
    } on ServerFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
