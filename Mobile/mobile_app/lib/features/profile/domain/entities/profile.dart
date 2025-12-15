import 'package:equatable/equatable.dart';
import '../../../auth/domain/entities/user.dart';

class Profile extends Equatable {
  final User user;
  final Map<String, dynamic>? teacherDetails; // Keep as Map for flexibility or strictly typed if needed

  const Profile({
    required this.user,
    this.teacherDetails,
  });

  @override
  List<Object?> get props => [user, teacherDetails];
}
