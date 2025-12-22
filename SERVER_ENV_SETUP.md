# Server .env Configuration

This file documents the required environment variables for the ILAI server deployment.

## ⚠️ CRITICAL: Missing Variables

The server's `.env` file is currently **missing** these required variables:

```bash
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
```

**Action Required**: Add these to the server's `.env` file immediately, as all services need database credentials.

## Complete Server .env Template

```bash
# Database Configuration
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_URL=jdbc:postgresql://postgres:5432/muse_db
DB_MAX_POOL_SIZE=5
DB_MIN_IDLE=5

# JWT Security Secrets
JWT_SECRET=bNl1hS4Fr5ljk8qrzkI26tYLsA+g5HvBoFUk2PM/nfkZ2JJ6fTKAPmr53RX3B2xPVGGy6yFTzrDOQ86ES7kjEyA==
JWT_ACCESS_SECRET=Lc/Mjsg4vlPGW7U8PBXAJztDH2CLDkrecg0XpUOcBwCv6r/HuKyxynuJcCSFoFXTDucZHPB/kNMs3xfHmbsvCA==
JWT_REFRESH_SECRET=J7kSKKF0dnwuICMwpCNQS279tMQf/HOWJz4lvzNKtVKaYxDFFuLbN+e6vDqP5ixiImE1cXS1kkO==

# Email Configuration (Gmail SMTP)
MAIL_USERNAME=prasanthalaparthi32@gmail.com
MAIL_PASSWORD=snyh ilpw pxai zsuc

# AI Configuration
GEMINI_API_KEY=AIzaSyDdksUAw6APTamsZy6JGL7qpTq6ZHW59O8
GROQ_API_KEY=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
TAVILY_API_KEY=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
LLM_PROVIDER=groq

# Frontend URL (for CORS)
FRONTEND_BASE_URL=https://www.ilai.co.in

# Keycloak Configuration
KEYCLOAK_ADMIN_PASSWORD=admin123
KEYCLOAK_ISSUER_URI=https://www.ilai.co.in/realms/ilai
KEYCLOAK_JWKS_URI=https://www.ilai.co.in/realms/ilai/protocol/openid-connect/certs
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=ilai
VITE_KEYCLOAK_CLIENT_ID=ilai-frontend

# Google OAuth2 (for Keycloak Identity Provider)
GOOGLE_CLIENT_ID=283750040258-99p8p5c30f4870bic8l1g8hnmf0ngjfa.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Application Settings
EMAIL_VERIFICATION_ENABLED=false
SPRING_PROFILES_ACTIVE=default
VITE_AUTH_MODE=jwt
```

## Deployment Instructions

### 1. SSH into the server

```bash
ssh ubuntu@<EC2_IP_ADDRESS>
```

### 2. Update the .env file

```bash
cd ~/ilai-001
nano .env
```

Add the missing variables:
```bash
DB_USERNAME=postgres
DB_PASSWORD=Prasanth
```

Save and exit (Ctrl+X, Y, Enter)

### 3. Restart services

```bash
sudo docker-compose down
sudo docker-compose up -d
```

### 4. Verify services

```bash
sudo docker-compose ps
sudo docker-compose logs auth-service | tail -20
```

## Notes

- **FRONTEND_BASE_URL**: Use HTTPS version (`https://www.ilai.co.in`)
- **Auth Mode**: Currently using `jwt` (custom auth), not `keycloak`
- **TAVILY_API_KEY**: Required for AI search features
- **DB Credentials**: Default postgres/Prasanth but should be changed to secure values in production
