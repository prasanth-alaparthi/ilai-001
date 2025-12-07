package com.muse.auth.auth.mail;

public interface MailService {
    void sendVerificationEmail(String to, String link);
    void sendPasswordReset(String to, String link);
}
