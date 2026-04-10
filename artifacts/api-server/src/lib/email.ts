import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await transporter.sendMail({
      from: `"Par for Purpose" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to Par for Purpose - Your Golf Charity Journey Begins!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">Welcome to Par for Purpose, ${name}!</h1>
          <p>Thank you for joining our mission to combine your passion for golf with making a real difference in charity.</p>

          <h2>Your Subscription is Active</h2>
          <p>You can now:</p>
          <ul>
            <li>Enter your golf scores and participate in monthly draws</li>
            <li>Track your charity contributions</li>
            <li>View upcoming draws and prize pools</li>
            <li>Manage your subscription and profile</li>
          </ul>

          <p>Remember: Every score you enter helps build the prize pool, and your charity contribution makes a real impact.</p>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            Access Your Dashboard
          </a>

          <p style="color: #666; font-size: 14px;">
            Questions? Reply to this email or visit our support page.
          </p>

          <p style="color: #666; font-size: 12px;">
            Par for Purpose - Where Every Swing Counts for Charity
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    // Don't throw - email failure shouldn't break registration
  }
}

export async function sendDrawResultsEmail(email: string, name: string, drawResults: any) {
  try {
    const { draw, winnings } = drawResults;

    await transporter.sendMail({
      from: `"Par for Purpose" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Draw Results: ${draw.month}/${draw.year} - Par for Purpose`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">Draw Results Are In!</h1>
          <p>Hi ${name},</p>

          <p>The ${draw.month}/${draw.year} draw has been completed. Here are the results:</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Draw Details</h3>
            <p><strong>Numbers:</strong> ${draw.numbers.join(", ")}</p>
            <p><strong>Total Prize Pool:</strong> £${draw.totalPrizePool?.toFixed(2)}</p>
          </div>

          ${winnings && winnings.length > 0 ? `
            <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #059669;">🎉 Congratulations! You Won!</h3>
              ${winnings.map((win: any) => `
                <p><strong>${win.matchType.replace(/_/g, " ").toUpperCase()}:</strong> £${win.prizeAmount?.toFixed(2)}</p>
              `).join("")}
              <p>Please submit your proof of winnings within 30 days to receive payment.</p>
            </div>
          ` : `
            <p>Better luck next time! Your participation helps grow the prize pool for everyone.</p>
          `}

          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/draws"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            View Full Results
          </a>

          <p style="color: #666; font-size: 14px;">
            Next draw: ${new Date(draw.nextDrawDate || Date.now()).toLocaleDateString()}
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send draw results email:", error);
  }
}

export async function sendWinnerNotificationEmail(email: string, name: string, winnerDetails: any) {
  try {
    await transporter.sendMail({
      from: `"Par for Purpose" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Winner Verification Required - Par for Purpose",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">🎉 Winner Verification Required</h1>
          <p>Hi ${name},</p>

          <p>Congratulations on your win! To receive your prize, please submit proof of your golf scores.</p>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Requirements:</h3>
            <ul>
              <li>Screenshot of your golf scores from the golf platform/app</li>
              <li>Clear image showing the date and scores</li>
              <li>Upload within 30 days of this notification</li>
            </ul>
          </div>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/winners"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            Submit Proof Now
          </a>

          <p style="color: #666; font-size: 14px;">
            If you have any questions, please reply to this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send winner notification email:", error);
  }
}