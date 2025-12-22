# Pre-Deployment Checklist

## ✅ Configuration Complete

All services are now configured to use environment variables. Review this checklist before deploying:

### Local Environment

- [x] `.env` file exists in project root
- [x] `.env` contains all 24 required variables
- [x] `.env` is in `.gitignore` (verified)
- [ ] **ACTION REQUIRED:** Do NOT commit `.env` to Git

### Docker Compose

- [x] `docker-compose.yml` uses environment variables
- [x] `docker-compose.aws.yml` uses environment variables
- [x] All services (postgres, auth, notes, social, ai, compute-engine) configured
- [x] No hardcoded credentials in compose files

### Application Properties

- [x] muse-auth-service: No hardcoded credentials
- [x] muse-notes-service: No hardcoded credentials
- [x] muse-social-service: No hardcoded credentials
- [x] muse-ai-service: No hardcoded credentials
- [x] muse-academic-service: No hardcoded credentials

### GitHub Actions CI/CD

- [x] Workflow updated to create `.env` from secrets
- [x] All 24 environment variables included in deployment
- [ ] **ACTION REQUIRED:** Add GitHub Secrets (see below)

### Documentation

- [x] QUICK_START.md created
- [x] GITHUB_SECRETS_SETUP.md created
- [x] SERVER_ENV_SETUP.md created
- [x] Walkthrough documentation generated

---

## 🚨 REQUIRED ACTION: Add GitHub Secrets

Before deploying, you MUST add these 24 secrets to your GitHub repository:

### How to Add Secrets

1. Go to: https://github.com/YOUR_USERNAME/ilai-001/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret below:

### Secrets List

```bash
# Database (5 secrets)
DB_USERNAME=postgres
DB_PASSWORD=Prasanth
DB_URL=jdbc:postgresql://postgres:5432/muse_db
DB_MAX_POOL_SIZE=5
DB_MIN_IDLE=5

# JWT (3 secrets)
JWT_SECRET=bNl1hS4Fr5ljk8qrzkI26tYLsA+g5HvBoFUk2PM/nfkZ2JJ6fTKAPmr53RX3B2xPVGGy6yFTzrDOQ86ES7kjEyA==
JWT_ACCESS_SECRET=Lc/Mjsg4vlPGW7U8PBXAJztDH2CLDkrecg0XpUOcBwCv6r/HuKyxynuJcCSFoFXTDucZHPB/kNMs3xfHmbsvCA==
JWT_REFRESH_SECRET=J7kSKKF0dnwuICMwpCNQS279tMQf/HOWJz4lvzNKtVKaYxDFFuLbN+e6vDqP5ixiImE1cXS1kkO==

# Email (2 secrets)
MAIL_USERNAME=prasanthalaparthi32@gmail.com
MAIL_PASSWORD=snyh ilpw pxai zsuc

# AI (4 secrets)
GEMINI_API_KEY=AIzaSyDdksUAw6APTamsZy6JGL7qpTq6ZHW59O8
GROQ_API_KEY=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
TAVILY_API_KEY=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
LLM_PROVIDER=groq

# URLs (1 secret)
FRONTEND_BASE_URL=https://www.ilai.co.in

# Keycloak (6 secrets)
KEYCLOAK_ADMIN_PASSWORD=admin123
KEYCLOAK_ISSUER_URI=https://www.ilai.co.in/realms/ilai
KEYCLOAK_JWKS_URI=https://www.ilai.co.in/realms/ilai/protocol/openid-connect/certs
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=ilai
VITE_KEYCLOAK_CLIENT_ID=ilai-frontend

# Google OAuth (2 secrets)
GOOGLE_CLIENT_ID=283750040258-99p8p5c30f4870bic8l1g8hnmf0ngjfa.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Settings (1 secret)
EMAIL_VERIFICATION_ENABLED=false
```

**NOTE:** When adding secrets to GitHub:
- Use the **Name** column for the key (e.g., `DB_USERNAME`)
- Use the **Value** column for the value (e.g., `postgres`)
- Do NOT include quotes or the `=` sign

---

## 📋 Deployment Steps

### Step 1: Verify GitHub Secrets (15 min)
- [ ] Navigate to GitHub repository settings
- [ ] Add all 24 secrets listed above
- [ ] Verify EC2_HOST, EC2_SSH_KEY, GHCR_TOKEN already exist

### Step 2: Commit Changes (2 min)
```bash
git add .
git commit -m "Configure services with environment variables and CI/CD pipeline"
git push origin main
```

### Step 3: Monitor Deployment (10 min)
- [ ] Go to Actions tab on GitHub
- [ ] Watch "Deploy ILAI to AWS EC2" workflow
- [ ] Verify all build jobs complete
- [ ] Verify deployment succeeds

### Step 4: Verify Services (5 min)
```bash
# SSH to EC2
ssh ubuntu@<YOUR_EC2_IP>

# Check services
cd ~/ilai-001
sudo docker-compose ps

# Check logs
sudo docker-compose logs auth-service | tail -20
sudo docker-compose logs notes-service | tail -20

# Test endpoints
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
```

### Step 5: Test Application
- [ ] Open https://www.ilai.co.in
- [ ] Test login
- [ ] Test note creation
- [ ] Test AI features

---

## 🔍 Verification Commands

### Check Environment Variables in Running Containers
```bash
# Auth service
sudo docker-compose exec auth-service env | grep -E "DB_|JWT_|MAIL_"

# Notes service  
sudo docker-compose exec notes-service env | grep -E "GEMINI_|GROQ_|LLM_"

# Social service
sudo docker-compose exec social-service env | grep -E "DB_|JWT_"
```

### View Container Logs
```bash
# All services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f auth-service
```

### Restart Services if Needed
```bash
# Restart all
sudo docker-compose restart

# Restart specific service
sudo docker-compose restart auth-service
```

---

## ⚠️ Troubleshooting

### Issue: Services won't start
**Solution:** Check all GitHub secrets are added correctly
```bash
# On EC2, verify .env was created
cat ~/ilai-001/.env
```

### Issue: Database connection failed
**Solution:** Verify DB credentials
```bash
# Check postgres container
sudo docker-compose logs postgres

# Verify credentials in .env
grep DB_ ~/ilai-001/.env
```

### Issue: JWT authentication fails
**Solution:** Ensure JWT secrets are identical across all services
```bash
# Verify secrets match
grep JWT_ ~/ilai-001/.env
```

### Issue: AI features not working
**Solution:** Check API keys are valid
```bash
# Verify AI keys
grep -E "GEMINI_|GROQ_|TAVILY" ~/ilai-001/.env
```

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ All services show as "healthy" in `docker-compose ps`
- ✅ No error logs in any service
- ✅ Health endpoints return 200 OK
- ✅ Frontend loads at https://www.ilai.co.in
- ✅ Users can login and create notes
- ✅ AI features respond correctly

---

## 📞 Need Help?

- Review: [GITHUB_SECRETS_SETUP.md](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/GITHUB_SECRETS_SETUP.md)
- Server Guide: [SERVER_ENV_SETUP.md](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/SERVER_ENV_SETUP.md)
- Quick Reference: [QUICK_START.md](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/QUICK_START.md)

**Ready to deploy!** 🚀
