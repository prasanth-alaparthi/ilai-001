package com.muse.auth.auth.enums;

import org.springframework.security.core.GrantedAuthority;

/**
 * Represents the roles a user can have in the application.
 */
public enum Role implements GrantedAuthority {
    /**
     * A student user.
     */
    /**
     * Default unverified account type.
     */
    ILAI,

    /**
     * A student user.
     */
    STUDENT,

    /**
     * A teacher user.
     */
    TEACHER,

    /**
     * A parent user, who can act as a guardian for students.
     */
    PARENT,

    /**
     * An administrator of a school or college.
     */
    INSTITUTION_ADMIN,

    /**
     * A system administrator with full access to the application.
     */
    ADMIN,

    /**
     * A system super administrator with full access to the application.
     */
    SUPER_ADMIN;

    @Override
    public String getAuthority() {
        return name();
    }
}
