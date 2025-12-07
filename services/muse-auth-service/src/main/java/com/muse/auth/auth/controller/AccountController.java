package com.muse.auth.auth.controller;

import com.muse.auth.auth.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @PutMapping("/{userId}/suspend")
    @PreAuthorize("hasRole('INSTITUTION_ADMIN')")
    public ResponseEntity<?> suspendAccount(@PathVariable Long userId) {
        accountService.suspendAccount(userId);
        return ResponseEntity.ok().build();
    }
}
