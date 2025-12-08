package com.muse.auth.security.oauth2;

import com.muse.auth.auth.entity.User;
import com.muse.auth.auth.enums.AccountStatus;
import com.muse.auth.auth.enums.AuthProvider;
import com.muse.auth.auth.enums.Role;
import com.muse.auth.auth.repository.UserRepository;
import com.muse.auth.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String providerName = userRequest.getClientRegistration().getRegistrationId();
        AuthProvider provider;
        try {
            // Map "google" -> GOOGLE, "microsoft-entra-id" -> MICROSOFT
            if (providerName.equalsIgnoreCase("microsoft-entra-id")) {
                provider = AuthProvider.MICROSOFT;
            } else {
                provider = AuthProvider.valueOf(providerName.toUpperCase());
            }
        } catch (IllegalArgumentException e) {
            provider = AuthProvider.LOCAL;
        }

        String email = oAuth2User.getAttribute("email");
        // Microsoft sometimes puts email in userPrincipalName
        if (email == null && provider == AuthProvider.MICROSOFT) {
            email = oAuth2User.getAttribute("userPrincipalName");
        }

        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        // Check by both username and email to prevent duplicate key violations
        Optional<User> userOptional = userRepository.findByUsernameOrEmail(email, email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Update provider info if it's a local user converting to OAuth
            if (user.getProvider() == null || user.getProvider() == AuthProvider.LOCAL) {
                user.setProvider(provider);
                user.setProviderId(oAuth2User.getName());
                userRepository.save(user);
            }
        } else {
            // Create new user only if not found by username or email
            user = User.builder()
                    .username(email)
                    .email(email)
                    .passwordHash("")
                    .role(Role.STUDENT)
                    .status(AccountStatus.ACTIVE)
                    .emailVerified(true)
                    .provider(provider)
                    .providerId(oAuth2User.getName())
                    .build();
            userRepository.save(user);
        }

        return new CustomUserDetails(user, oAuth2User.getAttributes());
    }
}
