import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/operations_bloc.dart';
import '../bloc/operations_event.dart';
import '../bloc/operations_state.dart';
import '../../domain/entities/offset_class.dart';
import '../../domain/entities/supplementary_class.dart';

class OperationsPage extends StatelessWidget {
  const OperationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => sl<OperationsBloc>()..add(LoadOperations()),
      child: DefaultTabController(
        length: 2,
        child: Scaffold(
          backgroundColor: AppColors.secondary.shade50,
          appBar: AppBar(
            title: const Text('Offset & Supplementary', style: TextStyle(fontWeight: FontWeight.bold)),
            backgroundColor: Colors.white,
            foregroundColor: AppColors.secondary.shade900,
            elevation: 0,
            bottom: TabBar(
              labelColor: AppColors.primary.shade600,
              unselectedLabelColor: AppColors.secondary.shade400,
              indicatorColor: AppColors.primary.shade600,
              tabs: const [
                Tab(text: 'Offset Classes'),
                Tab(text: 'Supplementary'),
              ],
            ),
          ),
          body: BlocBuilder<OperationsBloc, OperationsState>(
            builder: (context, state) {
              if (state is OperationsLoading) {
                return const Center(child: CircularProgressIndicator());
              } else if (state is OperationsLoaded) {
                return TabBarView(
                  children: [
                    _buildOffsetList(state.offsetClasses),
                    _buildSupplementaryList(state.supplementaryClasses),
                  ],
                );
              } else if (state is OperationsError) {
                return Center(child: Text(state.message));
              }
              return const SizedBox();
            },
          ),
        ),
      ),
    );
  }

  Widget _buildOffsetList(List<OffsetClass> classes) {
    if (classes.isEmpty) {
      return const Center(child: Text('No offset classes found.'));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: classes.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = classes[index];
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
                    DateFormat('MMM dd, yyyy').format(item.newDate),
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.secondary.shade900),
                  ),
                  _buildStatusChip(item.status),
                ],
              ),
              const SizedBox(height: 8),
              Text('Shift: ${item.newShift}', style: TextStyle(color: AppColors.secondary.shade600)),
              Text('Original: ${item.oldDate} (${item.oldShift})', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSupplementaryList(List<SupplementaryClass> classes) {
    if (classes.isEmpty) {
      return const Center(child: Text('No supplementary classes found.'));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: classes.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = classes[index];
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
                    DateFormat('MMM dd, yyyy').format(item.date),
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.secondary.shade900),
                  ),
                  _buildStatusChip(item.status),
                ],
              ),
              const SizedBox(height: 8),
              Text('Shift: ${item.shift}', style: TextStyle(color: AppColors.secondary.shade600)),
              Text('Reason: ${item.reason}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        color = AppColors.success.shade600;
        break;
      case 'pending':
        color = AppColors.warning.shade600;
        break;
      case 'rejected':
      case 'cancelled':
        color = AppColors.danger.shade600;
        break;
      default:
        color = AppColors.secondary.shade600;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }
}
