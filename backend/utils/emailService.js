const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send welcome email with password
const sendWelcomeEmail = async (email, name, password, role) => {
  try {
    const transporter = createTransporter();

    const roleName = role === 'faculty' ? 'Faculty' : role === 'student' ? 'Student' : 'Admin';

    const mailOptions = {
      from: `"SAAP" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to SAAP - Your Account Credentials',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .header {
              background-color: #2563eb;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .credentials {
              background-color: #eff6ff;
              border-left: 4px solid #2563eb;
              padding: 15px;
              margin: 20px 0;
            }
            .password {
              font-size: 18px;
              font-weight: bold;
              color: #2563eb;
              font-family: monospace;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6b7280;
              font-size: 12px;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SAAP</h1>
              <p>Smart Academic Automation Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your ${roleName} account has been created successfully!</p>
              
              <div class="credentials">
                <p><strong>Your Login Credentials:</strong></p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> <span class="password">${password}</span></p>
              </div>

              <div class="warning">
                <p><strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.</p>
              </div>

              <p>You can now log in to the SAAP platform using the credentials above.</p>
              
              <p>If you have any questions, please contact the system administrator.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} SAAP - Smart Academic Automation Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to SAAP - Smart Academic Automation Platform
        
        Hello ${name},
        
        Your ${roleName} account has been created successfully!
        
        Your Login Credentials:
        Email: ${email}
        Password: ${password}
        
        ⚠️ Important: Please change your password after your first login for security purposes.
        
        You can now log in to the SAAP platform using the credentials above.
        
        If you have any questions, please contact the system administrator.
        
        This is an automated email. Please do not reply.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
};

