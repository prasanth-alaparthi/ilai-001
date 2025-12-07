package com.muse.auth.auth.mail;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Profile("prod")
public class SmtpMailService implements MailService { // Removed @RequiredArgsConstructor as we're using @Value for fields

    private static final Logger logger = LoggerFactory.getLogger(SmtpMailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.sender-email:noreply@example.com}") // Default value if env var not set
    private String senderEmail;

    // Constructor for JavaMailSender
    public SmtpMailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    @Override
    public void sendVerificationEmail(String to, String link) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(to);
            message.setSubject("Muse Account Verification");
            message.setText("Please click the following link to verify your email address: " + link);
            mailSender.send(message);
            logger.info("Verification email sent to: {}", to);
        } catch (MailException e) {
            logger.error("Failed to send verification email to {}: {}", to, e.getMessage(), e);
            // Depending on requirements, you might rethrow or handle more gracefully
        }
    }

    @Async
    @Override
    public void sendPasswordReset(String to, String link) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(to);
            message.setSubject("Muse Password Reset Request");
            message.setText("Please click the following link to reset your password: " + link);
            mailSender.send(message);
            logger.info("Password reset email sent to: {}", to);
        } catch (MailException e) {
            logger.error("Failed to send password reset email to {}: {}", to, e.getMessage(), e);
            // Depending on requirements, you might rethrow or handle more gracefully
        }
    }
}
