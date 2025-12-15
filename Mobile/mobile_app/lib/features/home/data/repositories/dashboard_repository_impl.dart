import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/dashboard_stats.dart';
import '../../domain/repositories/dashboard_repository.dart';
import '../datasources/dashboard_remote_data_source.dart';

class DashboardRepositoryImpl implements DashboardRepository {
  final DashboardRemoteDataSource remoteDataSource;

  DashboardRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, DashboardStats>> getMyStats() async {
    try {
      final stats = await remoteDataSource.getMyStats();
      return Right(stats);
    } on ServerFailure catch (e) {
      return Left(e);
    } catch (e) {
      // In case of parsing error or other exceptions
      return Left(ServerFailure(e.toString()));
    }
  }
}
