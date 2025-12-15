import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';

import 'core/network/api_client.dart';
import 'features/auth/data/datasources/auth_remote_data_source.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/domain/usecases/login.dart';
import 'features/auth/domain/usecases/register.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/home/data/datasources/dashboard_remote_data_source.dart';
import 'features/home/data/repositories/dashboard_repository_impl.dart';
import 'features/home/domain/repositories/dashboard_repository.dart';
import 'features/home/domain/usecases/get_dashboard_stats.dart';
import 'features/home/presentation/bloc/dashboard_bloc.dart';

import 'features/schedule/data/datasources/schedule_remote_data_source.dart';
import 'features/schedule/data/repositories/schedule_repository_impl.dart';
import 'features/schedule/domain/repositories/schedule_repository.dart';
import 'features/schedule/domain/usecases/get_my_schedule.dart';
import 'features/schedule/presentation/bloc/schedule_bloc.dart';

import 'features/utilities/data/datasources/leave_remote_data_source.dart';
import 'features/utilities/data/repositories/leave_repository_impl.dart';
import 'features/utilities/domain/repositories/leave_repository.dart';
import 'features/utilities/domain/usecases/create_leave_request.dart';
import 'features/utilities/domain/usecases/get_leave_requests.dart';
import 'features/utilities/presentation/bloc/leave_bloc.dart';

import 'features/operations/data/datasources/operations_remote_data_source.dart';
import 'features/operations/data/repositories/operations_repository_impl.dart';
import 'features/operations/domain/repositories/operations_repository.dart';
import 'features/operations/domain/usecases/get_offset_classes.dart';
import 'features/operations/domain/usecases/get_supplementary_classes.dart';
import 'features/operations/domain/usecases/get_supplementary_classes.dart';
import 'features/operations/presentation/bloc/operations_bloc.dart';

import 'features/profile/data/datasources/profile_remote_data_source.dart';
import 'features/profile/data/repositories/profile_repository_impl.dart';
import 'features/profile/domain/repositories/profile_repository.dart';
import 'features/profile/domain/usecases/get_profile.dart';
import 'features/profile/presentation/bloc/profile_bloc.dart';

final sl = GetIt.instance; // sl = Service Locator

Future<void> init() async {
  //! Features - Auth
  // Bloc
  sl.registerFactory(() => AuthBloc(login: sl(), register: sl()));

  //! Features - Home
  sl.registerFactory(() => DashboardBloc(getDashboardStats: sl()));

  //! Features - Schedule
  // Bloc
  sl.registerFactory(() => ScheduleBloc(getMySchedule: sl()));
  // Use cases
  sl.registerLazySingleton(() => GetMySchedule(sl()));
  // Repository
  sl.registerLazySingleton<ScheduleRepository>(
    () => ScheduleRepositoryImpl(remoteDataSource: sl()),
  );
  // Data sources
  sl.registerLazySingleton<ScheduleRemoteDataSource>(
    () => ScheduleRemoteDataSourceImpl(apiClient: sl()),
  );

  //! Features - Leave
  // Bloc
  sl.registerFactory(() => LeaveBloc(
        getLeaveRequests: sl(),
        createLeaveRequest: sl(),
      ));
  // Use cases
  sl.registerLazySingleton(() => GetLeaveRequests(sl()));
  sl.registerLazySingleton(() => CreateLeaveRequest(sl()));
  // Repository
  sl.registerLazySingleton<LeaveRepository>(
    () => LeaveRepositoryImpl(remoteDataSource: sl()),
  );
  // Data sources
  sl.registerLazySingleton<LeaveRemoteDataSource>(
    () => LeaveRemoteDataSourceImpl(apiClient: sl()),
  );

  //! Features - Operations
  // Bloc
  sl.registerFactory(() => OperationsBloc(
        getOffsetClasses: sl(),
        getSupplementaryClasses: sl(),
      ));
  // Use cases
  sl.registerLazySingleton(() => GetOffsetClasses(sl()));
  sl.registerLazySingleton(() => GetSupplementaryClasses(sl()));
  // Repository
  sl.registerLazySingleton<OperationsRepository>(
    () => OperationsRepositoryImpl(remoteDataSource: sl()),
  );
  // Data sources
  sl.registerLazySingleton<OperationsRemoteDataSource>(
    () => OperationsRemoteDataSourceImpl(apiClient: sl()),
  );

  //! Features - Profile
  // Bloc
  sl.registerFactory(() => ProfileBloc(getProfile: sl()));
  // Use cases
  sl.registerLazySingleton(() => GetProfile(sl()));
  // Repository
  sl.registerLazySingleton<ProfileRepository>(
    () => ProfileRepositoryImpl(remoteDataSource: sl()),
  );
  // Data sources
  sl.registerLazySingleton<ProfileRemoteDataSource>(
    () => ProfileRemoteDataSourceImpl(apiClient: sl()),
  );

  // Use cases
  sl.registerLazySingleton(() => Login(sl()));
  sl.registerLazySingleton(() => Register(sl()));
  sl.registerLazySingleton(() => GetDashboardStats(sl()));

  // Repository
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton<DashboardRepository>(
    () => DashboardRepositoryImpl(remoteDataSource: sl()),
  );

  // Data sources
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(apiClient: sl()),
  );
  sl.registerLazySingleton<DashboardRemoteDataSource>(
    () => DashboardRemoteDataSourceImpl(apiClient: sl()),
  );

  //! Core
  sl.registerLazySingleton(() => ApiClient(dio: sl(), storage: sl()));

  //! External
  sl.registerLazySingleton(() => Dio());
  sl.registerLazySingleton(() => const FlutterSecureStorage());
}
