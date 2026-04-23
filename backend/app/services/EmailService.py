from app.integrations.Mailer import send_email, render_template


class EmailService:

    async def send_otp(self, to: str, otp: str, purpose: str) -> None:
        # Render the "otp_email" template with the OTP value and dispatch via Mailer.send_email.
        # Include the purpose ("Login Verification" vs "Password Reset") in the subject line.
        # Never log the OTP value — log only that an email was dispatched to the recipient address.
        pass

    async def send_rebalance_notification(self, to: str, portfolio_name: str, deep_link: str, expires_at: str) -> None:
        # Render the "rebalance_notification" template with portfolio name and deep link URL.
        # The deep link format is twintrades://rebalance/{event_id} for iOS universal link handling.
        # Include the human-readable expiry time so the user knows how long they have to act.
        pass

    async def send_monthly_report(self, to: str, report_data: dict) -> None:
        # Render the "monthly_report" template with performance data and trade summary.
        # report_data should include: period, portfolios, total_return_pct, trade_count.
        # Send at the start of each month for the previous month's data.
        pass
