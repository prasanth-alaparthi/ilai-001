package com.muse.auth.auth.service;

import com.muse.auth.auth.entity.User;
import com.muse.auth.auth.enums.AccountStatus;
import com.muse.auth.auth.enums.Role;
import com.muse.auth.auth.repository.UserRepository;
import com.muse.auth.security.CustomUserDetails; // This import will be fixed later
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void suspendAccount(Long userId) {
        CustomUserDetails adminDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();
        User admin = adminDetails.getUser();

        User userToSuspend = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Ensure the admin and the user belong to the same institution
        Long adminInstId = admin.getInstitution() != null ? admin.getInstitution().getId() : null;
        Long userInstId = userToSuspend.getInstitution() != null ? userToSuspend.getInstitution().getId() : null;

        if (adminInstId == null || !adminInstId.equals(userInstId)) {
            throw new AccessDeniedException("You can only suspend users from your own institution.");
        }

        if (userToSuspend.getRole() != Role.STUDENT && userToSuspend.getRole() != Role.TEACHER) {
            throw new AccessDeniedException("Only student and teacher accounts can be suspended.");
        }

        userToSuspend.setStatus(AccountStatus.SUSPENDED);
        userRepository.save(userToSuspend);
    }
}
