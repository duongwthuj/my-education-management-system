import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/leave_bloc.dart';
import '../bloc/leave_event.dart';
import '../bloc/leave_state.dart';
import '../../domain/entities/leave_request.dart';
import 'create_leave_request_page.dart';

class LeaveRequestListPage extends StatelessWidget {
  const LeaveRequestListPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => sl<LeaveBloc>()..add(LoadLeaveRequests()),
      child: Scaffold(
        backgroundColor: AppColors.secondary.shade50,
        appBar: AppBar(
          title: const Text('Leave Requests', style: TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.secondary.shade900,
          elevation: 0,
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => BlocProvider.value(
                value: context.read<LeaveBloc>(), // Pass existing bloc
                child: const CreateLeaveRequestPage(),
              )),
            );
          },
          backgroundColor: AppColors.primary.shade600,
          child: const Icon(Icons.add),
        ),
        body: BlocConsumer<LeaveBloc, LeaveState>(
          listener: (context, state) {
            if (state is LeaveError) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message)));
            }
          },
          builder: (context, state) {
            if (state is LeaveLoading) {
              return const Center(child: CircularProgressIndicator());
            } else if (state is LeaveLoaded) {
              if (state.requests.isEmpty) {
                 return Center(
                  child: Text('No leave requests found.', style: TextStyle(color: AppColors.secondary.shade500)),
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: state.requests.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  return _buildLeaveRequestCard(state.requests[index]);
                },
              );
            }
            return const SizedBox();
          },
        ),
      ),
    );
  }

  Widget _buildLeaveRequestCard(LeaveRequest request) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
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
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                DateFormat('MMM dd, yyyy').format(request.date),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AppColors.secondary.shade900,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.warning.shade100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Pending', // Status is not in Entity but implied or could be added
                  style: TextStyle(
                    color: AppColors.warning.shade700,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            request.reason,
            style: TextStyle(color: AppColors.secondary.shade600),
          ),
          const SizedBox(height: 8),
          if (request.substituteTeacherId != null)
             Row(
               children: [
                 Icon(Icons.person, size: 16, color: AppColors.primary.shade500),
                 const SizedBox(width: 4),
                 Text(
                   'Substitute Assigned', 
                   style: TextStyle(color: AppColors.primary.shade600, fontSize: 12, fontWeight: FontWeight.w500),
                 ),
               ],
             ),
        ],
      ),
    );
  }
}
