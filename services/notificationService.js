// File: backend/services/notificationService.js
const emailService = require('./emailService');

class NotificationService {
  async sendBookingNotifications(booking, guestInfo) {
    console.log('🚀 Sending booking notifications...');

    try {
      const result = await emailService.sendBookingConfirmation(
        booking,
        guestInfo
      );

      console.log('📧 Email Notification:', result ? '✅ Sent' : '❌ Failed');

      return { email: result };

    } catch (error) {
      console.error('❌ Notification error:', error.message);
      return { email: false };
    }
  }
}

module.exports = new NotificationService();
