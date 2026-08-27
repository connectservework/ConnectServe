const nodemailer = require('nodemailer');

/**
 * Sends an email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML formatted email body
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'noreply.connectserve@gmail.com',
        pass: 'jpphjqqwqaphxihk',
      },
    });

    const info = await transporter.sendMail({
      from: `"ConnectServe Community" <noreply.connectserve@gmail.com>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`[Email Service] Message sent successfully. ID: ${info.messageId}`);
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
