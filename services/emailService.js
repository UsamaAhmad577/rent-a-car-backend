const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // ✅ Gmail SMTP Transport
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  /**
   * Send booking confirmation to USER
   * and booking alert to ADMIN
   */
  async sendBookingConfirmation(booking, guestInfo) {
    try {
      // ============================
      // ✅ SAFETY CHECKS (VERY IMPORTANT)
      // ============================
      if (!guestInfo || !guestInfo.email) {
        throw new Error('Customer email is missing');
      }

      if (!process.env.GMAIL_USER) {
        throw new Error('Admin email (GMAIL_USER) is missing in .env');
      }

      console.log('📧 Sending customer email to:', guestInfo.email);
      console.log('📧 Sending admin email to:', process.env.GMAIL_USER);

      // ============================
      // 1️⃣ CUSTOMER EMAIL
      // ============================
      await this.transporter.sendMail({
        from: `"Jawhat Al Sharq Rent A Car" <${process.env.GMAIL_USER}>`,
        to: guestInfo.email,
        subject: `✅ Booking Confirmed – ${booking.car?.name || 'Your Car'}`,
        html: this.getCustomerEmail(booking, guestInfo),
      });

      // ============================
      // 2️⃣ ADMIN EMAIL
      // ============================
      await this.transporter.sendMail({
        from: `"Jawhat Al Sharq Rent A Car" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER, // Admin email
        subject: '🚗 New Booking Received',
        html: this.getAdminEmail(booking, guestInfo),
      });

      console.log('✅ Emails sent successfully (Customer + Admin)');
      return true;

    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      throw error;
    }
  }

  // =======================
  // CUSTOMER EMAIL TEMPLATE
  // =======================
  getCustomerEmail(booking, guestInfo) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color:#28a745;">✅ Booking Confirmed</h2>

        <p>Dear <strong>${guestInfo.name}</strong>,</p>

        <p>Your car booking has been confirmed. Here are your details:</p>

        <div style="background:#f4f4f4; padding:15px; border-radius:6px;">
          <p><strong>Car:</strong> ${booking.car?.name || 'N/A'}</p>
          <p><strong>Pick-up:</strong> ${new Date(booking.startDate).toDateString()}</p>
          <p><strong>Return:</strong> ${new Date(booking.endDate).toDateString()}</p>
          <p><strong>Total Price:</strong> AED ${booking.totalPrice}</p>
          <p><strong>Booking ID:</strong> ${booking._id}</p>
        </div>

        <h4>📌 Please Bring:</h4>
        <ul>
          <li>Valid Driving License</li>
          <li>Emirates ID / Passport</li>
          <li>Security Deposit: AED 1000 (Refundable)</li>
        </ul>

        <p><strong>📞 Contact:</strong> +971 50 736 8200</p>
        <p><strong>📍 Location:</strong> Dubai, UAE</p>

        <p style="margin-top:20px;">
          Thank you for choosing <strong>Jawhat Al Sharq Rent A Car</strong>.
        </p>
      </div>
    `;
  }

  // ===================
  // ADMIN EMAIL TEMPLATE
  // ===================
  getAdminEmail(booking, guestInfo) {
    return `
      <h2>🚗 New Booking Alert</h2>

      <p><strong>Car:</strong> ${booking.car?.name || 'N/A'}</p>
      <p><strong>Customer:</strong> ${guestInfo.name}</p>
      <p><strong>Phone:</strong> ${guestInfo.phone}</p>
      <p><strong>Email:</strong> ${guestInfo.email}</p>
      <p><strong>Total:</strong> AED ${booking.totalPrice}</p>

      <p><strong>Dates:</strong>
        ${new Date(booking.startDate).toDateString()}
        →
        ${new Date(booking.endDate).toDateString()}
      </p>

      <hr />

      <p>
        <a href="https://wa.me/${guestInfo.phone.replace(/\\D/g, '')}">
          📱 Contact on WhatsApp
        </a>
      </p>
    `;
  }
}

module.exports = new EmailService();
