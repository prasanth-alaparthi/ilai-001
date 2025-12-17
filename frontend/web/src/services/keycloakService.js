/**
 * Keycloak Authentication Service
 * 
 * This service provides Keycloak SSO integration for the ILAI frontend.
 * It supports both direct Keycloak login and the existing custom auth flow.
 * 
 * Usage:
 * - For Keycloak SSO: Set VITE_AUTH_MODE=keycloak in .env
 * - For custom auth: Set VITE_AUTH_MODE=custom (default)
 */

// Keycloak configuration
const KEYCLOAK_CONFIG = {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'ilai',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ilai-frontend',
};

// Check if Keycloak mode is enabled
export const isKeycloakEnabled = () => {
    return import.meta.env.VITE_AUTH_MODE === 'keycloak';
};

/**
 * Initialize Keycloak dynamically (lazy load)
 */
let keycloakInstance = null;

export const initKeycloak = async () => {
    if (!isKeycloakEnabled()) {
        console.log('Keycloak mode disabled. Using custom auth.');
        return null;
    }

    try {
        // Dynamically import keycloak-js only when needed
        const Keycloak = (await import('keycloak-js')).default;

        keycloakInstance = new Keycloak({
            url: KEYCLOAK_CONFIG.url,
            realm: KEYCLOAK_CONFIG.realm,
            clientId: KEYCLOAK_CONFIG.clientId,
        });

        const authenticated = await keycloakInstance.init({
            onLoad: 'check-sso',
            pkceMethod: 'S256',
            checkLoginIframe: false,
        });

        if (authenticated) {
            // Store tokens for API calls
            localStorage.setItem('accessToken', keycloakInstance.token);
            localStorage.setItem('refreshToken', keycloakInstance.refreshToken);

            // Set up automatic token refresh
            setupTokenRefresh();
        }

        return keycloakInstance;
    } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
        return null;
    }
};

/**
 * Set up automatic token refresh before expiry
 */
const setupTokenRefresh = () => {
    if (!keycloakInstance) return;

    // Refresh token 60 seconds before expiry
    const refreshInterval = setInterval(() => {
        keycloakInstance.updateToken(60)
            .then((refreshed) => {
                if (refreshed) {
                    localStorage.setItem('accessToken', keycloakInstance.token);
                    localStorage.setItem('refreshToken', keycloakInstance.refreshToken);
                    console.log('Token refreshed');
                }
            })
            .catch(() => {
                console.error('Failed to refresh token');
                clearInterval(refreshInterval);
                keycloakLogout();
            });
    }, 30000); // Check every 30 seconds
};

/**
 * Login via Keycloak
 */
export const keycloakLogin = () => {
    if (!keycloakInstance) {
        console.error('Keycloak not initialized');
        return;
    }

    keycloakInstance.login({
        redirectUri: window.location.origin + '/oauth2/redirect',
    });
};

/**
 * Login via Keycloak with Google IdP
 */
export const keycloakLoginWithGoogle = () => {
    if (!keycloakInstance) {
        // Fallback: redirect to Keycloak Google login directly
        const googleLoginUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?` +
            `client_id=${KEYCLOAK_CONFIG.clientId}&` +
            `redirect_uri=${encodeURIComponent(window.location.origin + '/oauth2/redirect')}&` +
            `response_type=code&` +
            `scope=openid%20profile%20email&` +
            `kc_idp_hint=google`;

        window.location.href = googleLoginUrl;
        return;
    }

    keycloakInstance.login({
        redirectUri: window.location.origin + '/oauth2/redirect',
        idpHint: 'google',
    });
};

/**
 * Register via Keycloak
 */
export const keycloakRegister = () => {
    if (!keycloakInstance) {
        console.error('Keycloak not initialized');
        return;
    }

    keycloakInstance.register({
        redirectUri: window.location.origin + '/oauth2/redirect',
    });
};

/**
 * Logout from Keycloak
 */
export const keycloakLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    if (keycloakInstance) {
        keycloakInstance.logout({
            redirectUri: window.location.origin + '/login',
        });
    } else {
        window.location.href = '/login';
    }
};

/**
 * Get current user info from Keycloak token
 */
export const getKeycloakUser = () => {
    if (!keycloakInstance || !keycloakInstance.tokenParsed) {
        return null;
    }

    const token = keycloakInstance.tokenParsed;
    return {
        id: token.sub,
        email: token.email,
        username: token.preferred_username || token.email,
        firstName: token.given_name,
        lastName: token.family_name,
        roles: token.realm_access?.roles || [],
        emailVerified: token.email_verified,
    };
};

/**
 * Check if user has a specific role
 */
export const hasRole = (role) => {
    if (!keycloakInstance || !keycloakInstance.tokenParsed) {
        return false;
    }

    const roles = keycloakInstance.tokenParsed.realm_access?.roles || [];
    return roles.includes(role);
};

/**
 * Get the access token for API calls
 */
export const getAccessToken = () => {
    return keycloakInstance?.token || localStorage.getItem('accessToken');
};

export default {
    isKeycloakEnabled,
    initKeycloak,
    keycloakLogin,
    keycloakLoginWithGoogle,
    keycloakRegister,
    keycloakLogout,
    getKeycloakUser,
    hasRole,
    getAccessToken,
};
