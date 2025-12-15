import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../injection_container.dart';
import '../bloc/profile_bloc.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<ProfileBloc>()..add(LoadProfile()),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Hồ Sơ Cá Nhân'),
        ),
        body: BlocBuilder<ProfileBloc, ProfileState>(
          builder: (context, state) {
            if (state is ProfileLoading) {
              return const Center(child: CircularProgressIndicator());
            } else if (state is ProfileError) {
              return Center(child: Text('Lỗi: ${state.message}'));
            } else if (state is ProfileLoaded) {
              final user = state.profile.user;
              final teacher = state.profile.teacherDetails;

              return SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionHeader('Thông tin Tài khoản'),
                    _buildInfoCard([
                      _buildInfoRow('Tên đăng nhập', user.username),
                      _buildInfoRow('Vai trò', user.role.toUpperCase()),
                      // Add created at if available in User entity
                    ]),
                    const SizedBox(height: 24),
                    _buildSectionHeader('Thông tin Giáo viên'),
                    if (teacher != null)
                      _buildInfoCard([
                         _buildInfoRow('Họ và tên', teacher['name'] ?? 'N/A'),
                         _buildInfoRow('Email', teacher['email'] ?? 'N/A'),
                         _buildInfoRow('Số điện thoại', teacher['phone'] ?? 'Chưa cập nhật'),
                         // Add more fields as needed based on JSON structure
                      ])
                    else
                      const Card(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: Text('Tài khoản này chưa được liên kết với hồ sơ giáo viên.', style: TextStyle(color: Colors.grey)),
                        ),
                      ),
                  ],
                ),
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Text(
        title,
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blueAccent),
      ),
    );
  }

  Widget _buildInfoCard(List<Widget> children) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: children,
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
