# AWS WAF Setup Guide for ILAI

## Overview

This guide covers setting up AWS Web Application Firewall (WAF) to protect ILAI services from common web attacks.

## Quick Setup via AWS Console

### Step 1: Create Web ACL

1. Go to **AWS Console** → **WAF & Shield** → **Web ACLs**
2. Click **Create web ACL**
3. Configure:
   - **Name**: `ilai-waf`
   - **Region**: Your deployment region (e.g., `ap-south-1`)
   - **Resource type**: CloudFront or Regional (ALB)

### Step 2: Add Managed Rules

Add these AWS Managed Rules (free tier covers most):

| Rule Group | Description | Priority |
|------------|-------------|----------|
| `AWSManagedRulesCommonRuleSet` | OWASP Top 10 protection | 1 |
| `AWSManagedRulesSQLiRuleSet` | SQL Injection protection | 2 |
| `AWSManagedRulesKnownBadInputsRuleSet` | Known bad inputs | 3 |
| `AWSManagedRulesAmazonIpReputationList` | Block bad IPs | 4 |

### Step 3: Add Rate Limiting Rule

1. Click **Add my own rules** → **Rate-based rule**
2. Configure:
   - **Name**: `ilai-rate-limit`
   - **Rate limit**: `2000` requests per 5 minutes
   - **IP address**: Use client IP
   - **Action**: Block

### Step 4: Associate with Resources

Associate the Web ACL with:
- CloudFront distribution (for frontend)
- Application Load Balancer (for APIs)

## Terraform Configuration (Optional)

```hcl
# waf-rules.tf

resource "aws_wafv2_web_acl" "ilai_waf" {
  name        = "ilai-waf"
  description = "WAF for ILAI application"
  scope       = "REGIONAL"  # Use "CLOUDFRONT" for CloudFront

  default_action {
    allow {}
  }

  # OWASP Common Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "CommonRules"
      sampled_requests_enabled  = true
    }
  }

  # SQL Injection Protection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "SQLiRules"
      sampled_requests_enabled  = true
    }
  }

  # Rate Limiting
  rule {
    name     = "RateLimit"
    priority = 10

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "RateLimit"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "ilaiWAF"
    sampled_requests_enabled  = true
  }
}

# Associate with ALB
resource "aws_wafv2_web_acl_association" "ilai_alb" {
  resource_arn = aws_lb.ilai_alb.arn
  web_acl_arn  = aws_wafv2_web_acl.ilai_waf.arn
}
```

## Estimated Costs

| Component | Cost |
|-----------|------|
| Web ACL | $5/month |
| Rules (first 1500) | $1/rule/month |
| Requests (first 10M) | $0.60/million |
| **Estimated Total** | **~$10-15/month** |

## Cloudflare Alternative (Free)

If cost is a concern, use Cloudflare's free tier:

1. Add your domain to Cloudflare
2. Enable these security features:
   - **Security Level**: Medium
   - **Bot Fight Mode**: On
   - **Rate Limiting**: 10,000 requests/min (free)
   - **WAF**: Basic rules (free)

## Verification

After setup, test the WAF:

```bash
# Test SQL injection (should be blocked)
curl -X POST "https://api.ilai.co.in/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"title": "test\" OR 1=1 --"}'

# Test rate limiting (run multiple times)
for i in {1..100}; do curl -s https://api.ilai.co.in/health; done
```

Check AWS WAF metrics in CloudWatch for blocked requests.
