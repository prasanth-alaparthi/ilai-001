# ILAI AWS Deployment Guide

## AWS Free Tier (12 Months)

Deploy ILAI on AWS with the free tier resources.

### What's Included FREE (12 months)

| Resource | Free Tier | Usage |
|----------|-----------|-------|
| EC2 | 750 hours/month t2.micro | Backend services |
| RDS | 750 hours/month db.t3.micro | PostgreSQL |
| ElastiCache | 750 hours/month | Redis |
| S3 | 5GB storage | File uploads |
| CloudFront | 1TB transfer | CDN |
| Lambda | 1M requests/month | Optional functions |

---

## Quick Start (15 minutes)

### Step 1: Install AWS CLI

```powershell
# Windows
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Configure
aws configure
# Enter: Access Key, Secret Key, Region (ap-south-1 for India)
```

### Step 2: Create Key Pair

```bash
aws ec2 create-key-pair --key-name ilai-key --query 'KeyMaterial' --output text > ilai-key.pem
chmod 400 ilai-key.pem  # Linux/Mac
```

### Step 3: Run Setup Script

```powershell
.\scripts\setup-aws.ps1 -Region "ap-south-1"
```

---

## Manual Setup (Console)

### 1. Create VPC & Subnet

1. Go to **VPC** → **Create VPC**
2. Name: `ilai-vpc`
3. IPv4 CIDR: `10.0.0.0/16`
4. Create public subnet: `10.0.1.0/24`

### 2. Create Security Group

1. **EC2** → **Security Groups** → **Create**
2. Name: `ilai-sg`
3. Inbound rules:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | Your IP | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |

### 3. Create RDS (PostgreSQL)

1. **RDS** → **Create Database**
2. **Free tier** checkbox ✓
3. Engine: PostgreSQL 15
4. Instance: db.t3.micro
5. Storage: 20GB
6. Username: `postgres`
7. Password: (save this!)
8. Public access: Yes (for initial setup)

### 4. Create ElastiCache (Redis)

1. **ElastiCache** → **Create**
2. Engine: Redis
3. Node type: cache.t3.micro (free tier)
4. Replicas: 0

### 5. Launch EC2 Instance

1. **EC2** → **Launch Instance**
2. AMI: Amazon Linux 2023
3. Instance type: t2.micro (free tier)
4. Key pair: ilai-key
5. Security group: ilai-sg
6. Storage: 30GB (free tier allows 30GB)

---

## Deploy to EC2

### SSH into EC2

```bash
ssh -i ilai-key.pem ec2-user@<EC2-PUBLIC-IP>
```

### Install Dependencies

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo yum install -y git

# Logout and login for docker group
exit
```

### Clone and Deploy

```bash
ssh -i ilai-key.pem ec2-user@<EC2-PUBLIC-IP>

# Clone repo
git clone https://github.com/your-repo/ilai.git
cd ilai

# Create environment file
cat > .env << EOF
DB_URL=jdbc:postgresql://<RDS-ENDPOINT>:5432/ilai
DB_USER=postgres
DB_PASSWORD=<your-password>
JWT_SECRET=<your-secret>
GEMINI_API_KEY=<your-key>
GROQ_API_KEY=<your-key>
REDIS_HOST=<ELASTICACHE-ENDPOINT>
REDIS_PORT=6379
EOF

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## AWS Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        AWS Cloud                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐     ┌─────────────────────────┐    │
│  │   Route 53      │────▶│   CloudFront (CDN)      │    │
│  │  (DNS - $0.50)  │     │   (1TB free/month)      │    │
│  └─────────────────┘     └───────────┬─────────────┘    │
│                                      │                   │
│                          ┌───────────▼─────────────┐    │
│                          │  Application Load       │    │
│                          │  Balancer (optional)    │    │
│                          └───────────┬─────────────┘    │
│                                      │                   │
│  ┌───────────────────────────────────▼──────────────┐   │
│  │              EC2 t2.micro (750h free)            │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐  │   │
│  │  │  Auth   │ │  Notes  │ │   AI    │ │ Social │  │   │
│  │  │ :8081   │ │  :8082  │ │  :8088  │ │ :8086  │  │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └────────┘  │   │
│  │  ┌─────────────────────────────────────────────┐ │   │
│  │  │              Nginx + Frontend               │ │   │
│  │  └─────────────────────────────────────────────┘ │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────┼───────────────────────────┐   │
│  │                      ▼                            │   │
│  │  ┌─────────────────────┐  ┌─────────────────────┐│   │
│  │  │   RDS PostgreSQL    │  │  ElastiCache Redis  ││   │
│  │  │   db.t3.micro       │  │   cache.t3.micro    ││   │
│  │  │   (750h free)       │  │   (750h free)       ││   │
│  │  └─────────────────────┘  └─────────────────────┘│   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                 S3 Bucket                         │   │
│  │          (uploads, 5GB free)                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Cost Estimate (Free Tier)

| Resource | Monthly Cost |
|----------|--------------|
| EC2 t2.micro | $0 (750h free) |
| RDS db.t3.micro | $0 (750h free) |
| ElastiCache | $0 (750h free) |
| S3 (5GB) | $0 |
| CloudFront (1TB) | $0 |
| Route 53 | ~$0.50 |
| **Total** | **~$0.50/month** |

### After Free Tier (13+ months)

| Resource | Monthly Cost |
|----------|--------------|
| EC2 t3.small | ~$15 |
| RDS db.t3.micro | ~$15 |
| ElastiCache | ~$13 |
| **Total** | **~$50/month** |

---

## Domain Setup (Route 53)

1. **Route 53** → **Hosted Zones** → **Create**
2. Domain: `ilai.co.in`
3. Add records:

| Type | Name | Value |
|------|------|-------|
| A | @ | EC2 Public IP |
| A | www | EC2 Public IP |
| A | api | EC2 Public IP |

---

## SSL Certificate (Free)

### Option A: AWS Certificate Manager (for CloudFront/ALB)

1. **ACM** → **Request Certificate**
2. Add domains: `ilai.co.in`, `*.ilai.co.in`
3. Validate via DNS
4. Attach to CloudFront

### Option B: Let's Encrypt (for EC2 directly)

```bash
sudo yum install -y certbot
sudo certbot certonly --standalone -d ilai.co.in -d www.ilai.co.in
```

---

## Monitoring & Logs

### CloudWatch (Free Tier: 10 metrics)

```bash
# View logs
aws logs tail /aws/ec2/ilai --follow
```

### Check EC2 Status

```bash
aws ec2 describe-instance-status --instance-ids i-xxxxx
```

---

## Troubleshooting

### Can't connect to EC2
```bash
# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Check instance state
aws ec2 describe-instances --instance-ids i-xxxxx
```

### Can't connect to RDS
```bash
# Test connection from EC2
psql -h <rds-endpoint> -U postgres -d postgres
```

### Services not starting
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Next Steps

1. ✅ Create AWS account (done!)
2. Run `.\scripts\setup-aws.ps1`
3. Deploy services
4. Configure domain
5. Enable SSL
