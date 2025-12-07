package com.muse.auth.auth.enums;

public enum AccountStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED,
    BANNED,
    PENDING_VERIFICATION, // For email verification
    PENDING_INSTITUTION_VERIFICATION, // New status for institution approval
    BLOCKED,
    DELETED
}
