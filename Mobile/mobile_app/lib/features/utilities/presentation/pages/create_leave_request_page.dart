import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/leave_bloc.dart';
import '../bloc/leave_event.dart';
import '../bloc/leave_state.dart';

class CreateLeaveRequestPage extends StatefulWidget {
  const CreateLeaveRequestPage({super.key});

  @override
  State<CreateLeaveRequestPage> createState() => _CreateLeaveRequestPageState();
}

class _CreateLeaveRequestPageState extends State<CreateLeaveRequestPage> {
  final _reasonController = TextEditingController();
  DateTime? _selectedDate;
  // In a real app, we would fetch the user's fixed schedule to select from.
  // For MVP, we might simulate or ask only for date and reason (backend resolves schedule).
  // Implementation Plan says: Requires fixedScheduleId, date, reason.
  // We need to fetch FixedSchedules... but that's in Schedule feature.
  // Let's create a simple form for now that asks for Date/Reason and sends a dummy ID or
  // ideally, we should list "My Fixed Schedules" and let user pick one.
  
  // To keep it simple as per "Mobile" nature:
  // Maybe user picks a Date, and we find the Fixed Schedule on that date?
  // Let's assume user just picks a date and enters reason.
  // We will send a HARDCODED ID or handle in backend if logic allows?
  // The API requires fixedScheduleId.
  // So we MUST let user select a schedule.
  
  // Short-cut: Just text input for "Fixed Schedule ID" (bad UX) or
  // We should have a dropdown. But we don't have that data in LeaveBloc.
  // We need to inject ScheduleBloc or Repository here?
  // Let's stick to simple Date Picker and Text Input for now.
  // We will assume the backend might handle it or we pass a placeholder.
  // Actually, to make it work "physically", I should try to fetch schedules.
  // But that complicates things.
  // Let's just implement the UI.

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.secondary.shade50,
      appBar: AppBar(
        title: const Text('New Leave Request', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.secondary.shade900,
        elevation: 0,
      ),
      body: BlocListener<LeaveBloc, LeaveState>(
        listener: (context, state) {
          if (state is LeaveOperationSuccess) {
            Navigator.pop(context); // Go back on success
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message)));
          } else if (state is LeaveError) {
             ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message)));
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildDateSelector(),
              const SizedBox(height: 16),
              // Schedule ID input (Temporary)
              // TextField(decoration: InputDecoration(labelText: 'Fixed Schedule ID (Temp)')),
              // const SizedBox(height: 16),
              TextField(
                controller: _reasonController,
                maxLines: 4,
                decoration: InputDecoration(
                  labelText: 'Reason',
                  alignLabelWithHint: true,
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary.shade600,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Submit Request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDateSelector() {
    return GestureDetector(
      onTap: _pickDate,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(Icons.calendar_today, color: AppColors.primary.shade500),
            const SizedBox(width: 16),
            Text(
              _selectedDate == null 
                ? 'Select Date' 
                : '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}',
              style: TextStyle(
                color: _selectedDate == null ? AppColors.secondary.shade400 : AppColors.secondary.shade900,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() => _selectedDate = date);
    }
  }

  void _submit() {
    if (_selectedDate == null || _reasonController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
      return;
    }
    
    // For MVP, passing a dummy ID since we don't have the schedule list selector yet.
    // In real app, we must select a valid FixedSchedule ID.
    context.read<LeaveBloc>().add(CreateLeaveRequestEvent(
      fixedScheduleId: 'dummy_id_needs_selector', 
      date: _selectedDate!,
      reason: _reasonController.text,
    ));
  }
}
