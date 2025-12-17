#!/bin/bash
# Oracle Cloud VM Setup Script for ILAI
# Run this on each ARM VM after SSH access

set -e

echo "=========================================="
echo "  ILAI Oracle Cloud VM Setup"
echo "=========================================="

# Update system
echo "[1/6] Updating system packages..."
sudo dnf update -y

# Install Docker
echo "[2/6] Installing Docker..."
sudo dnf install -y dnf-utils
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
echo "[3/6] Starting Docker..."
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Java 21 (for building)
echo "[4/6] Installing Java 21..."
sudo dnf install -y java-21-openjdk java-21-openjdk-devel maven

# Install Git
echo "[5/6] Installing Git..."
sudo dnf install -y git

# Configure firewall
echo "[6/6] Configuring firewall..."
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=8081-8090/tcp
sudo firewall-cmd --reload

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Log out and log back in (for Docker permissions)"
echo "  2. Clone your repo: git clone <your-repo>"
echo "  3. Copy .env.prod to .env and fill in values"
echo "  4. Run: docker compose -f docker-compose.prod.yml up -d"
echo ""
