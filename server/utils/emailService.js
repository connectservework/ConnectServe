const nodemailer = require('nodemailer');

const getTransporter = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_USER === 'your_smtp_user'
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Sends an email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML formatted email body
 */
const sendEmail = async (to, subject, htmlContent) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Email Service - Simulated] To: ${to} | Subject: "${subject}"`);
    return { simulated: true, success: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"ConnectServe Community" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`[Email Service] Message sent: %s`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service Error]', error.message);
    return { success: false, error: error.message };
  }
};

const sendApplicationStatusEmail = async (user, event, status, notes = '') => {
  const isApproved = status === 'approved';
  const subject = isApproved
    ? `🎉 Application Approved: ${event.title}`
    : `Update on your application: ${event.title}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: ${isApproved ? '#059669' : '#e11d48'};">
        ${isApproved ? 'You are confirmed!' : 'Application Update'}
      </h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>
        Your application for the community service event <strong>"${event.title}"</strong> has been
        <strong>${status.toUpperCase()}</strong>.
      </p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
        <p style="margin: 4px 0;"><strong>Time:</strong> ${event.time}</p>
        <p style="margin: 4px 0;"><strong>Location:</strong> ${event.location}</p>
        <p style="margin: 4px 0;"><strong>Hours:</strong> ${event.hoursGranted} hours</p>
        ${notes ? `<p style="margin: 4px 0;"><strong>Organizer Note:</strong> ${notes}</p>` : ''}
      </div>
      <p>Thank you for giving back to the community!</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 25px;">
        ConnectServe - Empowering Social Impact & Volunteers
      </p>
    </div>
  `;

  return sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendApplicationStatusEmail,
};
