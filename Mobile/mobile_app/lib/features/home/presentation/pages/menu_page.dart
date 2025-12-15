import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/pages/login_page.dart';
import '../../../utilities/presentation/pages/leave_request_list_page.dart';
import '../../../operations/presentation/pages/operations_page.dart';
import '../../../profile/presentation/pages/profile_page.dart';

class MenuPage extends StatelessWidget {
  const MenuPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.secondary.shade50,
      appBar: AppBar(
        title: const Text('Menu', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.secondary.shade900,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildMenuSection(
            title: 'Management',
            children: [
              _buildMenuItem(
                icon: Icons.assignment_late_outlined,
                title: 'Leave Requests',
                onTap: () {
                  Navigator.push(
                    context, 
                    MaterialPageRoute(builder: (_) => const LeaveRequestListPage())
                  );
                },
              ),
              _buildMenuItem(
                icon: Icons.layers_outlined,
                title: 'Offset & Supplementary',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const OperationsPage()),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 24),
          _buildMenuSection(
            title: 'Account',
            children: [
              _buildMenuItem(
                icon: Icons.person_outline,
                title: 'Profile',
                onTap: () {
                    Navigator.push(
                    context, 
                    MaterialPageRoute(builder: (_) => const ProfilePage())
                  );
                },
              ),
              _buildMenuItem(
                icon: Icons.logout,
                title: 'Logout',
                textColor: AppColors.danger.shade600,
                iconColor: AppColors.danger.shade600,
                onTap: () {
                  // Logout logic
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (context) => const LoginPage()),
                    (route) => false,
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMenuSection({required String title, required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 8),
          child: Text(
            title.toUpperCase(),
            style: TextStyle(
              color: AppColors.secondary.shade500,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? textColor,
    Color? iconColor,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: (iconColor ?? AppColors.primary.shade600).withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: iconColor ?? AppColors.primary.shade600, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          color: textColor ?? AppColors.secondary.shade900,
        ),
      ),
      trailing: Icon(Icons.chevron_right, color: AppColors.secondary.shade400, size: 20),
    );
  }
}
