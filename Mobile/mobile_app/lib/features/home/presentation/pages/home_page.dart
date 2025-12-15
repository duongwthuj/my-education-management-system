import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/dashboard_bloc.dart';
import '../bloc/dashboard_event.dart';
import '../bloc/dashboard_state.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => sl<DashboardBloc>()..add(LoadDashboardStats()),
      child: Scaffold(
        backgroundColor: AppColors.secondary.shade50,
        body: BlocBuilder<DashboardBloc, DashboardState>(
          builder: (context, state) {
            if (state is DashboardLoading) {
              return const Center(child: CircularProgressIndicator());
            } else if (state is DashboardError) {
              return Center(child: Text(state.message));
            } else if (state is DashboardLoaded) {
              final stats = state.stats;
              return CustomScrollView(
                slivers: [
                  _buildSliverAppBar(),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildGreetingSection(),
                          const SizedBox(height: 24),
                          _buildSummaryCards(stats),
                          const SizedBox(height: 24),
                          _buildUpcomingNextClass(stats.upcomingClasses),
                          const SizedBox(height: 24),
                          Text(
                            'Upcoming Classes',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppColors.secondary.shade900,
                            ),
                          ),
                          const SizedBox(height: 16),
                          _buildUpcomingClassesList(stats.upcomingClasses),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            }
            return const SizedBox();
          },
        ),
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      pinned: true,
      floating: true,
      backgroundColor: AppColors.primary.shade600,
      expandedHeight: 0, // Collapsed by default
      title: const Text('LMS Connect', style: TextStyle(fontWeight: FontWeight.bold)),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          onPressed: () {},
        ),
        const Padding(
          padding: EdgeInsets.only(right: 16.0),
          child: CircleAvatar(
            backgroundColor: Colors.white24,
            child: Icon(Icons.person, color: Colors.white),
          ),
        ),
      ],
    );
  }

  Widget _buildGreetingSection() {
    // Placeholder greeting - in real app would use user name
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Welcome back,',
          style: TextStyle(fontSize: 14, color: AppColors.secondary.shade500),
        ),
        Text(
          'Teacher',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppColors.secondary.shade900,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCards(stats) {
    return SizedBox(
      height: 140, // Height for horizontal scroll
      child: ListView(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        children: [
          _buildStatCard('Hours this month', '${stats.hoursMonth}h', Icons.access_time,
              AppColors.primary),
          const SizedBox(width: 16),
          _buildStatCard('Test Classes', '${stats.testHours}h',
              Icons.assignment_turned_in, AppColors.success),
           const SizedBox(width: 16),
          _buildStatCard('Supplementary', '${stats.supplementaryCount}',
              Icons.layers, AppColors.warning),
           const SizedBox(width: 16),
          _buildStatCard('Total Upcoming', '${stats.upcomingCount}',
              Icons.calendar_today, AppColors.danger),
        ],
      ),
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, MaterialColor color) {
    return Container(
      width: 140,
      padding: const EdgeInsets.all(16),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color.shade600, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.secondary.shade900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: AppColors.secondary.shade500,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingNextClass(List classes) {
     if (classes.isEmpty) return const SizedBox.shrink();

     final nextClass = classes.first;
     return Container(
       width: double.infinity,
       padding: const EdgeInsets.all(20),
       decoration: BoxDecoration(
         gradient: LinearGradient(
           colors: [AppColors.primary.shade600, AppColors.primary.shade400],
           begin: Alignment.topLeft,
           end: Alignment.bottomRight,
         ),
         borderRadius: BorderRadius.circular(20),
         boxShadow: [
           BoxShadow(
             color: AppColors.primary.shade500.withOpacity(0.3),
             blurRadius: 15,
             offset: const Offset(0, 8),
           ),
         ],
       ),
       child: Column(
         crossAxisAlignment: CrossAxisAlignment.start,
         children: [
           Row(
             mainAxisAlignment: MainAxisAlignment.spaceBetween,
             children: [
               Container(
                 padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                 decoration: BoxDecoration(
                   color: Colors.white.withOpacity(0.2),
                   borderRadius: BorderRadius.circular(20),
                 ),
                 child: const Text(
                   'Next Class',
                   style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                 ),
               ),
               Icon(Icons.arrow_forward, color: Colors.white.withOpacity(0.8), size: 20),
             ],
           ),
           const SizedBox(height: 16),
           Text(
             nextClass.className,
             style: const TextStyle(
               color: Colors.white,
               fontSize: 22,
               fontWeight: FontWeight.bold,
             ),
           ),
           const SizedBox(height: 4),
           Text(
             nextClass.subject,
             style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14),
           ),
           const SizedBox(height: 16),
           Row(
             children: [
               Icon(Icons.access_time_filled, color: Colors.white.withOpacity(0.8), size: 16),
               const SizedBox(width: 6),
               Text(
                 '${nextClass.time} • Today',
                 style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
               ),
             ],
           ),
         ],
       ),
     );
  }

  Widget _buildUpcomingClassesList(List classes) {
    if (classes.length <= 1) { // 1 is shown in "Next Class"
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Text(
            'No other upcoming classes.',
            style: TextStyle(color: AppColors.secondary.shade400),
          ),
        ),
      );
    }
    
    // Skip the first one as it is shown in "Next Class" card
    final list = classes.sublist(1);

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: list.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final cls = list[index];
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.secondary.shade200),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.primary.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.book, color: AppColors.primary.shade600),
            ),
            title: Text(
              cls.className,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AppColors.secondary.shade900,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text(cls.subject, style: TextStyle(color: AppColors.secondary.shade500, fontSize: 12)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 12, color: AppColors.secondary.shade400),
                    const SizedBox(width: 4),
                    Text(
                      '${cls.time} - ${cls.date}',
                       style: TextStyle(color: AppColors.secondary.shade600, fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ],
            ),
            trailing: _buildTypeTag(cls.type),
          ),
        );
      },
    );
  }

  Widget _buildTypeTag(String type) {
    Color bg;
    Color text;
    
    switch (type) {
      case 'Offset':
        bg = AppColors.warning.shade100;
        text = AppColors.warning.shade700;
        break;
      case 'Test':
        bg = AppColors.success.shade100; // Using success color for Test as distinctive
        text = AppColors.success.shade700;
        break;
      case 'Supplementary':
        bg = AppColors.secondary.shade200;
        text = AppColors.secondary.shade700;
        break;
      default:
        bg = AppColors.primary.shade100;
        text = AppColors.primary.shade700;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        type,
        style: TextStyle(
          color: text,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

