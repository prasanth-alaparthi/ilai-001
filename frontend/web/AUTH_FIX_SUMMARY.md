# Authentication & File Fixes

I have resolved the authentication endpoint mismatch and fixed the corrupted `auth.jsx` file.

## Issues Resolved
1.  **Authentication Failure (401)**:
    *   **Cause**: The frontend was using `/auth/login`, but the backend expects `/auth/authenticate`. Additionally, the API client interceptor was incorrectly trying to refresh the token on login failure because `/auth/authenticate` wasn't in the `publicEndpoints` list.
    *   **Fix**: Updated `src/services/authService.js` to use `/auth/authenticate` and updated `src/services/apiClient.js` to include `/auth/authenticate` in `publicEndpoints`.

2.  **File Corruption & Warnings**:
    *   **Cause**: Previous edits to `src/pages/auth.jsx` inadvertently truncated the file and left a `class` vs `className` warning.
    *   **Fix**: Completely restored `src/pages/auth.jsx` with the correct code, ensuring the `Link` component is present and using `className`.

## Verification
*   **Login**: Should now correctly hit `/api/auth/authenticate`. If credentials are valid, it will succeed. If invalid, it will return 401 without triggering an infinite refresh loop.
*   **UI**: The "Forgot your password?" link should render correctly without console warnings.

## Next Steps
*   Retry logging in with valid credentials.
*   If you don't have an account, use the "Register" toggle to create one.
