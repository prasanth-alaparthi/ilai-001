# Quick Start: Deploy ILAI with Environment Variables

## ✅ What's Been Done

All ILAI services are now configured to use environment variables from your `.env` file. **No hardcoded credentials anywhere!**

## 🚀 Next Steps (15 minutes)

### Step 1: Add GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these 24 secrets (copy values from your `.env` file):

**Database (5 secrets):**
- `DB_USERNAME` = `postgres`
- `DB_PASSWORD` = `Prasanth`
- `DB_URL` = `jdbc:postgresql://postgres:5432/muse_db`
- `DB_MAX_POOL_SIZE` = `5`
- `DB_MIN_IDLE` = `5`

**JWT (3 secrets):**
- `JWT_SECRET` = (your JWT secret)
- `JWT_ACCESS_SECRET` = (your JWT access secret)
- `JWT_REFRESH_SECRET` = (your JWT refresh secret)

**Email (2 secrets):**
- `MAIL_USERNAME` = `prasanthalaparthi32@gmail.com`
- `MAIL_PASSWORD` = `snyh ilpw pxai zsuc`

**AI (4 secrets):**
- `GEMINI_API_KEY` = (your Gemini key)
- `GROQ_API_KEY` = (your Groq key)
- `TAVILY_API_KEY` = (your Tavily key)
- `LLM_PROVIDER` = `groq`

**URLs (1 secret):**
- `FRONTEND_BASE_URL` = `https://www.ilai.co.in`

**Keycloak (6 secrets):**
- `KEYCLOAK_ADMIN_PASSWORD` = `admin123`
- `KEYCLOAK_ISSUER_URI` = `https://www.ilai.co.in/realms/ilai`
- `KEYCLOAK_JWKS_URI` = `https://www.ilai.co.in/realms/ilai/protocol/openid-connect/certs`
- `VITE_KEYCLOAK_URL` = `http://localhost:8080`
- `VITE_KEYCLOAK_REALM` = `ilai`
- `VITE_KEYCLOAK_CLIENT_ID` = `ilai-frontend`

**Google OAuth (2 secrets):**
- `GOOGLE_CLIENT_ID` = (your Google client ID)
- `GOOGLE_CLIENT_SECRET` = (your Google client secret)

**Settings (1 secret):**
- `EMAIL_VERIFICATION_ENABLED` = `false`

### Step 2: Deploy

```bash
# Commit changes
git add .
git commit -m "Configure services with environment variables"
git push origin main
```

The GitHub Actions workflow will:
1. Build all service images
2. Push to GitHub Container Registry
3. SSH to your EC2 server
4. Create `.env` file from secrets
5. Deploy with docker-compose

### Step 3: Verify

Monitor deployment: https://github.com/your-repo/actions

Check services on EC2:
```bash
ssh ubuntu@your-ec2-ip
cd ~/ilai-001
sudo docker-compose ps
```

## 📚 Full Documentation

- **GitHub Secrets Setup:** [GITHUB_SECRETS_SETUP.md](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/GITHUB_SECRETS_SETUP.md)
- **Server Deployment:** [SERVER_ENV_SETUP.md](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/SERVER_ENV_SETUP.md)
- **Complete Walkthrough:** See artifacts panel

## 🔒 Security Notes

- ✅ `.env` is gitignored
- ✅ No credentials in source code
- ✅ GitHub Actions uses encrypted secrets
- ⚠️ **Never commit `.env` to Git!**

## ❓ Troubleshooting

**Services won't start?**
- Check all 24 secrets are added to GitHub
- Verify secret names match exactly (case-sensitive)

**Database connection fails?**
- Ensure `DB_USERNAME` and `DB_PASSWORD` are correct

**AI features not working?**
- Verify `GEMINI_API_KEY` and `GROQ_API_KEY` are valid

---

**Questions?** Check the full guides in your project directory.
