import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import '../../../../injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/schedule_event.dart';
import '../bloc/schedule_bloc.dart';
import '../bloc/schedule_event.dart';
import '../bloc/schedule_state.dart';

class SchedulePage extends StatefulWidget {
  const SchedulePage({super.key});

  @override
  State<SchedulePage> createState() => _SchedulePageState();
}

class _SchedulePageState extends State<SchedulePage> {
  CalendarFormat _calendarFormat = CalendarFormat.month; // Default as per spec
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
  }

  List<ScheduleEvent> _getEventsForDay(DateTime day, List<ScheduleEvent> allEvents) {
    return allEvents.where((event) {
      // Comparison ignoring time
      return isSameDay(event.date, day);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => sl<ScheduleBloc>()..add(LoadSchedule(_focusedDay)),
      child: Scaffold(
        backgroundColor: AppColors.secondary.shade50,
        appBar: AppBar(
          title: const Text('Schedule', style: TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.secondary.shade900,
          elevation: 0,
        ),
        body: BlocBuilder<ScheduleBloc, ScheduleState>(
          builder: (context, state) {
            List<ScheduleEvent> allEvents = [];
            if (state is ScheduleLoaded) {
              allEvents = state.events;
            }

            return Column(
              children: [
                _buildCalendar(context, allEvents),
                const SizedBox(height: 8),
                Expanded(
                  child: _buildEventList(context, allEvents),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildCalendar(BuildContext context, List<ScheduleEvent> events) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.only(bottom: 16),
      child: TableCalendar(
        firstDay: DateTime.now().subtract(const Duration(days: 365)),
        lastDay: DateTime.now().add(const Duration(days: 365)),
        focusedDay: _focusedDay,
        calendarFormat: _calendarFormat,
        selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
        eventLoader: (day) => _getEventsForDay(day, events),
        startingDayOfWeek: StartingDayOfWeek.monday,
        calendarStyle: CalendarStyle(
          outsideDaysVisible: false,
          weekendTextStyle: TextStyle(color: AppColors.danger.shade500),
          todayDecoration: BoxDecoration(
            color: AppColors.primary.shade200,
            shape: BoxShape.circle,
          ),
          selectedDecoration: BoxDecoration(
            color: AppColors.primary.shade600,
            shape: BoxShape.circle,
          ),
          markerDecoration: BoxDecoration(
            color: AppColors.warning.shade500,
            shape: BoxShape.circle,
          ),
        ),
        headerStyle: const HeaderStyle(
          formatButtonVisible: false,
          titleCentered: true,
        ),
        onDaySelected: (selectedDay, focusedDay) {
          if (!isSameDay(_selectedDay, selectedDay)) {
            setState(() {
              _selectedDay = selectedDay;
              _focusedDay = focusedDay;
            });
          }
        },
        onPageChanged: (focusedDay) {
          _focusedDay = focusedDay;
          context.read<ScheduleBloc>().add(LoadSchedule(focusedDay));
        },
      ),
    );
  }

  Widget _buildEventList(BuildContext context, List<ScheduleEvent> allEvents) {
    final events = _getEventsForDay(_selectedDay!, allEvents);

    if (events.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy, size: 64, color: AppColors.secondary.shade200),
            const SizedBox(height: 16),
            Text(
              'No classes on this day',
              style: TextStyle(color: AppColors.secondary.shade400),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: events.length,
      itemBuilder: (context, index) {
        final event = events[index];
        return _buildEventCard(event);
      },
    );
  }

  Widget _buildEventCard(ScheduleEvent event) {
    Color stripColor;
    switch (event.type) {
      case ScheduleType.offset:
        stripColor = AppColors.warning.shade500;
        break;
      case ScheduleType.test:
        stripColor = AppColors.success.shade500;
        break;
      case ScheduleType.supplementary:
        stripColor = AppColors.secondary.shade500;
        break;
      default:
        stripColor = AppColors.primary.shade500;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            Container(
              width: 6,
              decoration: BoxDecoration(
                color: stripColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(12),
                  bottomLeft: Radius.circular(12),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${event.startTime} - ${event.endTime}',
                          style: TextStyle(
                            color: AppColors.secondary.shade500,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                        if (event.type != ScheduleType.fixed)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: stripColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              event.type.name.toUpperCase(),
                              style: TextStyle(
                                color: stripColor,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      event.title,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: AppColors.secondary.shade900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      event.subject,
                      style: TextStyle(
                        color: AppColors.secondary.shade600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
