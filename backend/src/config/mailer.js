const fs = require('fs');
const path = require('path');

/**
 * Sends a mockup email by appending it to a local log file and outputting to the console.
 * @param {Object} options Email options
 * @param {string} options.to Recipient email address
 * @param {string} options.subject Email subject
 * @param {string} options.html HTML email content
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const logDir = path.join(__dirname, '../../logs');
    const logFile = path.join(logDir, 'notifications.log');

    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = `
======================================================================
[EMAIL ALERT SENT]
Timestamp: ${new Date().toLocaleString()}
To: ${to}
Subject: ${subject}
----------------------------------------------------------------------
Content:
${html}
======================================================================
\n`;

    fs.appendFileSync(logFile, logEntry, 'utf8');
    console.log(`✉️  Mock email successfully dispatched to <${to}> | Subject: "${subject}"`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to log mock email send: ${error.message}`);
    return false;
  }
};

module.exports = { sendEmail };
