import axios from 'axios';

/**
 * Service để gửi email thông báo qua Power Automate
 */
class EmailNotificationService {
    constructor() {
        // Power Automate webhook URL sẽ được config trong .env
        this.powerAutomateUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL || '';
    }

    /**
     * Gửi thông báo phân công lớp offset cho giáo viên
     * @param {String} teacherEmail - Email giáo viên
     * @param {Object} classInfo - Thông tin lớp học
     */
    async sendTeacherAssignmentNotification(teacherEmail, classInfo) {
        if (!this.powerAutomateUrl) {
            console.warn('Power Automate webhook URL is not configured');
            return null;
        }

        try {
            const emailData = {
                recipientEmail: teacherEmail,
                subject: `Thông báo phân công lớp bù: ${classInfo.className}`,
                emailType: 'teacher_assignment',
                data: {
                    teacherName: classInfo.teacherName,
                    className: classInfo.className,
                    scheduledDate: this.formatDate(classInfo.scheduledDate),
                    startTime: classInfo.startTime,
                    endTime: classInfo.endTime,
                    meetingLink: classInfo.meetingLink || 'Sẽ được cập nhật sau',
                    message: `Kính gửi thầy/cô ${classInfo.teacherName},\n\n` +
                        `Trường thông báo thầy/cô đã được phân công dạy lớp bù với thông tin như sau:\n\n` +
                        `- Tên lớp: ${classInfo.className}\n` +
                        `- Ngày học: ${this.formatDate(classInfo.scheduledDate)}\n` +
                        `- Thời gian: ${classInfo.startTime} - ${classInfo.endTime}\n` +
                        `- Link học online: ${classInfo.meetingLink || 'Sẽ được cập nhật sau'}\n\n` +
                        `Vui lòng xác nhận và chuẩn bị giảng dạy.\n\n` +
                        `Trân trọng,\nPhòng Quản lý Giảng dạy`
                }
            };

            const response = await axios.post(this.powerAutomateUrl, emailData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 seconds timeout
            });

            console.log('Email notification sent successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending email notification:', error.message);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Gửi thông báo về lịch làm việc sắp tới cho giáo viên
     * @param {String} teacherEmail - Email giáo viên
     * @param {Object} scheduleInfo - Thông tin lịch làm việc
     */
    async sendScheduleReminderNotification(teacherEmail, scheduleInfo) {
        if (!this.powerAutomateUrl) {
            console.warn('Power Automate webhook URL is not configured');
            return null;
        }

        try {
            const emailData = {
                recipientEmail: teacherEmail,
                subject: `Nhắc nhở lịch làm việc: ${scheduleInfo.date}`,
                emailType: 'schedule_reminder',
                data: {
                    teacherName: scheduleInfo.teacherName,
                    date: this.formatDate(scheduleInfo.date),
                    shifts: scheduleInfo.shifts,
                    message: `Kính gửi thầy/cô ${scheduleInfo.teacherName},\n\n` +
                        `Đây là lịch làm việc của thầy/cô vào ngày ${this.formatDate(scheduleInfo.date)}:\n\n` +
                        scheduleInfo.shifts.map(shift =>
                            `- Ca ${shift.name}: ${shift.startTime} - ${shift.endTime}\n`
                        ).join('') +
                        `\nVui lòng xác nhận và chuẩn bị sẵn sàng.\n\n` +
                        `Trân trọng,\nPhòng Quản lý Giảng dạy`
                }
            };

            const response = await axios.post(this.powerAutomateUrl, emailData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('Schedule reminder sent successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending schedule reminder:', error.message);
            throw new Error(`Failed to send schedule reminder: ${error.message}`);
        }
    }

    /**
     * Gửi thông báo khi có thay đổi về lớp offset
     * @param {String} teacherEmail - Email giáo viên
     * @param {Object} changeInfo - Thông tin thay đổi
     */
    async sendClassChangeNotification(teacherEmail, changeInfo) {
        if (!this.powerAutomateUrl) {
            console.warn('Power Automate webhook URL is not configured');
            return null;
        }

        try {
            const emailData = {
                recipientEmail: teacherEmail,
                subject: `Thông báo thay đổi lớp: ${changeInfo.className}`,
                emailType: 'class_change',
                data: {
                    teacherName: changeInfo.teacherName,
                    className: changeInfo.className,
                    changeType: changeInfo.changeType, // 'cancelled', 'rescheduled', 'reassigned'
                    oldScheduledDate: changeInfo.oldScheduledDate ? this.formatDate(changeInfo.oldScheduledDate) : null,
                    newScheduledDate: changeInfo.newScheduledDate ? this.formatDate(changeInfo.newScheduledDate) : null,
                    reason: changeInfo.reason,
                    message: this.buildChangeMessage(changeInfo)
                }
            };

            const response = await axios.post(this.powerAutomateUrl, emailData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('Class change notification sent successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending class change notification:', error.message);
            throw new Error(`Failed to send class change notification: ${error.message}`);
        }
    }

    /**
     * Gửi email batch cho nhiều giáo viên
     * @param {Array} notifications - Danh sách thông báo
     */
    async sendBatchNotifications(notifications) {
        if (!this.powerAutomateUrl) {
            console.warn('Power Automate webhook URL is not configured');
            return null;
        }

        const results = [];

        for (const notification of notifications) {
            try {
                let result;

                switch (notification.type) {
                    case 'assignment':
                        result = await this.sendTeacherAssignmentNotification(
                            notification.email,
                            notification.data
                        );
                        break;
                    case 'reminder':
                        result = await this.sendScheduleReminderNotification(
                            notification.email,
                            notification.data
                        );
                        break;
                    case 'change':
                        result = await this.sendClassChangeNotification(
                            notification.email,
                            notification.data
                        );
                        break;
                    default:
                        result = { success: false, message: 'Unknown notification type' };
                }

                results.push({
                    email: notification.email,
                    success: true,
                    result
                });
            } catch (error) {
                results.push({
                    email: notification.email,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Xây dựng nội dung message cho thông báo thay đổi
     */
    buildChangeMessage(changeInfo) {
        let message = `Kính gửi thầy/cô ${changeInfo.teacherName},\n\n`;

        switch (changeInfo.changeType) {
            case 'cancelled':
                message += `Lớp ${changeInfo.className} vào ngày ${this.formatDate(changeInfo.oldScheduledDate)} ` +
                    `đã bị hủy.\n\nLý do: ${changeInfo.reason || 'Không rõ'}\n`;
                break;

            case 'rescheduled':
                message += `Lớp ${changeInfo.className} đã được chuyển lịch:\n\n` +
                    `- Lịch cũ: ${this.formatDate(changeInfo.oldScheduledDate)} ${changeInfo.oldStartTime} - ${changeInfo.oldEndTime}\n` +
                    `- Lịch mới: ${this.formatDate(changeInfo.newScheduledDate)} ${changeInfo.newStartTime} - ${changeInfo.newEndTime}\n\n` +
                    `Lý do: ${changeInfo.reason || 'Không rõ'}\n`;
                break;

            case 'reassigned':
                message += `Lớp ${changeInfo.className} vào ngày ${this.formatDate(changeInfo.scheduledDate)} ` +
                    `đã được phân công lại cho thầy/cô.\n\n` +
                    `Thông tin lớp học:\n` +
                    `- Thời gian: ${changeInfo.startTime} - ${changeInfo.endTime}\n` +
                    `- Link học online: ${changeInfo.meetingLink || 'Sẽ được cập nhật sau'}\n`;
                break;

            default:
                message += `Có thay đổi về lớp ${changeInfo.className}.\n` +
                    `Chi tiết: ${changeInfo.reason || 'Vui lòng liên hệ phòng quản lý'}\n`;
        }

        message += `\nVui lòng xác nhận đã nhận được thông báo.\n\n` +
            `Trân trọng,\nPhòng Quản lý Giảng dạy`;

        return message;
    }

    /**
     * Format date sang định dạng dd/mm/yyyy
     */
    formatDate(date) {
        if (!date) return '';

        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        return `${day}/${month}/${year}`;
    }

    /**
     * Test webhook connection
     */
    async testConnection() {
        if (!this.powerAutomateUrl) {
            return {
                success: false,
                message: 'Power Automate webhook URL is not configured'
            };
        }

        try {
            const testData = {
                recipientEmail: 'test@example.com',
                subject: 'Test Connection',
                emailType: 'test',
                data: {
                    message: 'This is a test email from LMS Backend'
                }
            };

            const response = await axios.post(this.powerAutomateUrl, testData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            return {
                success: true,
                message: 'Connection successful',
                response: response.data
            };
        } catch (error) {
            return {
                success: false,
                message: 'Connection failed',
                error: error.message
            };
        }
    }
}

export default new EmailNotificationService();
