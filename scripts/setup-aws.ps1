# AWS Setup Script for ILAI
# Creates VPC, Security Group, RDS, and EC2 instance

param(
    [string]$Region = "ap-south-1",
    [string]$KeyPairName = "ilai-key",
    [string]$DbPassword = "IlaiDb2024!",
    [string]$InstanceType = "t2.micro"
)

Write-Host "`n=== ILAI AWS Setup ===" -ForegroundColor Magenta

# Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI not installed. Install from: https://aws.amazon.com/cli/"
    exit 1
}

# Set region
$env:AWS_DEFAULT_REGION = $Region
Write-Host "Region: $Region" -ForegroundColor Yellow

# Step 1: Create VPC
Write-Host "`n[1/7] Creating VPC..." -ForegroundColor Cyan
$vpc = aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text
aws ec2 create-tags --resources $vpc --tags Key=Name,Value=ilai-vpc
aws ec2 modify-vpc-attribute --vpc-id $vpc --enable-dns-hostnames
Write-Host "VPC: $vpc" -ForegroundColor Green

# Step 2: Create Subnet
Write-Host "`n[2/7] Creating Subnet..." -ForegroundColor Cyan
$az = "${Region}a"
$subnet = aws ec2 create-subnet --vpc-id $vpc --cidr-block 10.0.1.0/24 --availability-zone $az --query 'Subnet.SubnetId' --output text
aws ec2 create-tags --resources $subnet --tags Key=Name,Value=ilai-subnet
aws ec2 modify-subnet-attribute --subnet-id $subnet --map-public-ip-on-launch
Write-Host "Subnet: $subnet" -ForegroundColor Green

# Step 3: Create Internet Gateway
Write-Host "`n[3/7] Creating Internet Gateway..." -ForegroundColor Cyan
$igw = aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text
aws ec2 attach-internet-gateway --internet-gateway-id $igw --vpc-id $vpc
aws ec2 create-tags --resources $igw --tags Key=Name,Value=ilai-igw
Write-Host "IGW: $igw" -ForegroundColor Green

# Step 4: Create Route Table
$rtb = aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpc" --query 'RouteTables[0].RouteTableId' --output text
aws ec2 create-route --route-table-id $rtb --destination-cidr-block 0.0.0.0/0 --gateway-id $igw

# Step 5: Create Security Group
Write-Host "`n[4/7] Creating Security Group..." -ForegroundColor Cyan
$sg = aws ec2 create-security-group --group-name ilai-sg --description "ILAI Security Group" --vpc-id $vpc --query 'GroupId' --output text

# Add rules
aws ec2 authorize-security-group-ingress --group-id $sg --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $sg --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $sg --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $sg --protocol tcp --port 5432 --source-group $sg
aws ec2 authorize-security-group-ingress --group-id $sg --protocol tcp --port 6379 --source-group $sg
Write-Host "Security Group: $sg" -ForegroundColor Green

# Step 6: Create Key Pair
Write-Host "`n[5/7] Creating Key Pair..." -ForegroundColor Cyan
$keyFile = "$KeyPairName.pem"
if (Test-Path $keyFile) {
    Write-Host "Key pair file already exists: $keyFile" -ForegroundColor Yellow
} else {
    aws ec2 create-key-pair --key-name $KeyPairName --query 'KeyMaterial' --output text | Out-File -Encoding ascii $keyFile
    Write-Host "Key saved to: $keyFile" -ForegroundColor Green
}

# Step 7: Create RDS Subnet Group
Write-Host "`n[6/7] Creating RDS..." -ForegroundColor Cyan
$subnet2 = aws ec2 create-subnet --vpc-id $vpc --cidr-block 10.0.2.0/24 --availability-zone "${Region}b" --query 'Subnet.SubnetId' --output text
aws rds create-db-subnet-group --db-subnet-group-name ilai-db-subnet --db-subnet-group-description "ILAI DB Subnet" --subnet-ids $subnet $subnet2

# Create RDS
aws rds create-db-instance `
    --db-instance-identifier ilai-db `
    --db-instance-class db.t3.micro `
    --engine postgres `
    --engine-version 15 `
    --master-username postgres `
    --master-user-password $DbPassword `
    --allocated-storage 20 `
    --vpc-security-group-ids $sg `
    --db-subnet-group-name ilai-db-subnet `
    --publicly-accessible `
    --no-multi-az

Write-Host "RDS creating (takes 5-10 minutes)..." -ForegroundColor Yellow

# Step 8: Get Latest Amazon Linux 2023 AMI
Write-Host "`n[7/7] Launching EC2..." -ForegroundColor Cyan
$ami = aws ssm get-parameters --names /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64 --query 'Parameters[0].Value' --output text

# Launch EC2
$instance = aws ec2 run-instances `
    --image-id $ami `
    --instance-type $InstanceType `
    --key-name $KeyPairName `
    --security-group-ids $sg `
    --subnet-id $subnet `
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=ilai-server}]" `
    --query 'Instances[0].InstanceId' `
    --output text

Write-Host "EC2 Instance: $instance" -ForegroundColor Green

# Wait for instance
Write-Host "Waiting for EC2 to be running..." -ForegroundColor Yellow
aws ec2 wait instance-running --instance-ids $instance

# Get public IP
$publicIp = aws ec2 describe-instances --instance-ids $instance --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "EC2 Public IP: $publicIp" -ForegroundColor Cyan
Write-Host "SSH Command:   ssh -i $keyFile ec2-user@$publicIp" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait for RDS to be 'available' (5-10 min), then get endpoint:" -ForegroundColor Yellow
Write-Host "aws rds describe-db-instances --db-instance-identifier ilai-db --query 'DBInstances[0].Endpoint.Address' --output text"
Write-Host ""

# Save config
$config = @"
# ILAI AWS Configuration
# Generated: $(Get-Date)

EC2_INSTANCE_ID=$instance
EC2_PUBLIC_IP=$publicIp
VPC_ID=$vpc
SUBNET_ID=$subnet
SECURITY_GROUP=$sg
KEY_PAIR=$KeyPairName
REGION=$Region

# RDS (update after RDS is available)
RDS_ENDPOINT=<run: aws rds describe-db-instances --db-instance-identifier ilai-db --query 'DBInstances[0].Endpoint.Address' --output text>
RDS_PASSWORD=$DbPassword
"@

$config | Out-File -Encoding utf8 "aws-config.txt"
Write-Host "Configuration saved to aws-config.txt" -ForegroundColor Green
