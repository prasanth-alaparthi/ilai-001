package com.muse.auth.auth.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!prod")
public class ConsoleMailService implements MailService {

    private static final Logger logger = LoggerFactory.getLogger(ConsoleMailService.class);

    @Override
    public void sendVerificationEmail(String to, String link) {
        logger.info("--- MOCK EMAIL ---");
        logger.info("To: {}", to);
        logger.info("Subject: Verify Your Email");
        logger.info("Body: Please click the following link to verify your email address: {}", link);
        logger.info("--------------------");
    }

    @Override
    public void sendPasswordReset(String to, String link) {
        logger.info("--- MOCK EMAIL ---");
        logger.info("To: {}", to);
        logger.info("Subject: Password Reset Request");
        logger.info("Body: Please click the following link to reset your password: {}", link);
        logger.info("--------------------");
    }
}
