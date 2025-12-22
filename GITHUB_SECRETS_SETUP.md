# GitHub Secrets Configuration Guide

This guide explains how to set up GitHub Secrets for the ILAI CI/CD pipeline.

## Required GitHub Secrets

Navigate to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets with values from your `.env` file:

### Database Configuration

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `DB_USERNAME` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `your_secure_password` |
| `DB_URL` | JDBC connection URL | `jdbc:postgresql://postgres:5432/muse_db` |
| `DB_MAX_POOL_SIZE` | Maximum connection pool size | `5` |
| `DB_MIN_IDLE` | Minimum idle connections | `5` |

### JWT Security

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `JWT_SECRET` | Main JWT secret | `your_base64_encoded_secret` |
| `JWT_ACCESS_SECRET` | JWT access token secret | `your_base64_encoded_secret` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `your_base64_encoded_secret` |

### Email Configuration

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `MAIL_USERNAME` | Gmail/SMTP username | `your_email@gmail.com` |
| `MAIL_PASSWORD` | App-specific password | `your_app_password` |

### AI Configuration

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `GROQ_API_KEY` | Groq API key | `gsk_...` |
| `TAVILY_API_KEY` | Tavily search API key | `tvly-dev-...` |
| `LLM_PROVIDER` | LLM provider to use | `groq` or `gemini` |

### Application URLs

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `FRONTEND_BASE_URL` | Frontend URL for CORS | `https://www.ilai.co.in` |

### Keycloak SSO

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak admin password | `admin123` |
| `KEYCLOAK_ISSUER_URI` | Keycloak issuer URI | `https://www.ilai.co.in/realms/ilai` |
| `KEYCLOAK_JWKS_URI` | Keycloak JWKS endpoint | `https://www.ilai.co.in/realms/ilai/protocol/openid-connect/certs` |
| `VITE_KEYCLOAK_URL` | Keycloak URL for frontend | `http://localhost:8080` |
| `VITE_KEYCLOAK_REALM` | Keycloak realm name | `ilai` |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID | `ilai-frontend` |

### Google OAuth2

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `12345...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-...` |

### Other Settings

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `EMAIL_VERIFICATION_ENABLED` | Enable email verification | `false` or `true` |
| `SPRING_PROFILES_ACTIVE` | Spring Boot profile | `default` or `keycloak` |
| `VITE_AUTH_MODE` | Frontend auth mode | `jwt` or `keycloak` |

### Existing Secrets (Should Already Be Configured)

These should already exist in your repository:

- `EC2_HOST` - EC2 instance IP address
- `EC2_SSH_KEY` - Private SSH key for EC2 access
- `GHCR_TOKEN` - GitHub Container Registry token

## How to Add Secrets

1. **Navigate to Repository Settings**
   ```
   Your Repository → Settings → Secrets and variables → Actions
   ```

2. **Click "New repository secret"**

3. **Add each secret:**
   - Name: Use the exact secret name from the table above
   - Value: Copy from your `.env` file (without quotes)
   - Click "Add secret"

4. **Verify all secrets are added:**
   - You should see all secrets listed (values will be hidden)
   - Total: ~18 secrets

## Security Best Practices

- ✅ **Never commit** the `.env` file to Git
- ✅ **Rotate secrets** regularly (every 90 days recommended)
- ✅ **Use strong passwords** and random secrets
- ✅ **Limit access** to GitHub repository settings
- ✅ **Monitor usage** in GitHub Actions logs
- ❌ **Don't share** secrets via insecure channels
- ❌ **Don't hardcode** secrets in code or docker files

## Generating Secure Secrets

### JWT Secrets
```bash
# Generate a 64-character base64 encoded secret
openssl rand -base64 64
```

### Gmail App Password
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Generate App Password for "Mail"
4. Use that 16-character password

### API Keys
- **Gemini**: https://makersuite.google.com/app/apikey
- **Groq**: https://console.groq.com/keys
- **Google OAuth**: https://console.cloud.google.com/apis/credentials

## Testing After Setup

After adding all secrets, test the deployment:

```bash
# Push to main branch to trigger deployment
git add .
git commit -m "Configure environment variables"
git push origin main
```

Monitor the workflow in **Actions** tab to ensure deployment succeeds.

## Troubleshooting

### Issue: Service fails to start
- **Check:** All required secrets are added
- **Check:** Secret names match exactly (case-sensitive)
- **Check:** No typos in secret values

### Issue: Database connection fails
- **Check:** `DB_USERNAME`, `DB_PASSWORD`, `DB_URL` are correct
- **Check:** PostgreSQL is running on EC2

### Issue: JWT authentication fails
- **Check:** All JWT secrets (`JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) match across services
- **Check:** Secrets are base64 encoded

### Issue: AI features not working
- **Check:** `GEMINI_API_KEY` or `GROQ_API_KEY` is valid
- **Check:** `LLM_PROVIDER` is set to `groq` or `gemini`
- **Check:** API quotas are not exceeded
