# Security Monitoring Guide

**Version:** 1.0  
**Last Updated:** October 25, 2025  
**Project:** Outlivion Dashboard

---

## Overview

This guide provides instructions for ongoing security monitoring and maintenance of the Outlivion Dashboard. Regular monitoring helps detect and prevent security incidents before they impact users.

---

## Daily Monitoring (Automated)

### 1. Error Rate Monitoring

**Check:** Vercel deployment logs for error spikes

```bash
# View recent errors
vercel logs --follow | grep -i "error"

# Count errors in last hour
vercel logs | grep -i "error" | wc -l
```

**Alert Threshold:** > 10 errors per minute

**Actions:**
- Investigate error patterns
- Check for failed authentication attempts
- Review database connection errors

---

### 2. Failed Authentication Attempts

**Check:** 401 Unauthorized responses

```bash
# Check authentication failures
vercel logs | grep "401"
```

**Alert Threshold:** > 50 failed attempts per hour from single IP

**Actions:**
- Investigate IP address
- Check for brute force patterns
- Consider IP blocking if malicious

---

### 3. Rate Limit Triggers

**Check:** 429 Too Many Requests responses

```bash
# Check rate limit hits
vercel logs | grep "429"
```

**Normal:** Occasional rate limits (5-10 per day)  
**Suspicious:** Consistent rate limiting from multiple IPs

**Actions:**
- Review rate limit thresholds
- Identify if legitimate traffic or attack
- Adjust limits if needed

---

## Weekly Monitoring

### 1. Supabase Dashboard Review

**Location:** Supabase Dashboard → Database

#### Check:
- [ ] Query performance (no slow queries > 1s)
- [ ] Database size growth (expected pattern)
- [ ] RLS policy violations (should be 0)
- [ ] Connection pool usage (< 80%)

**Actions:**
- Optimize slow queries
- Archive old data if needed
- Review any RLS violations

---

### 2. Payment Webhook Monitoring

**Location:** Vercel logs + Supabase transactions table

#### Check:
```sql
-- Check payment webhook failures
SELECT 
  status,
  COUNT(*) as count,
  DATE(created_at) as date
FROM payments
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status, DATE(created_at)
ORDER BY date DESC;
```

**Expected:** > 95% success rate

**Actions:**
- Investigate failed webhooks
- Verify Enot.io webhook signature
- Check network connectivity issues

---

### 3. Code Activation Patterns

**Check:** Unusual code activation patterns

```sql
-- Check code activations
SELECT 
  DATE(used_at) as date,
  COUNT(*) as activations
FROM codes
WHERE used_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(used_at)
ORDER BY date DESC;

-- Check for multiple codes used by same user
SELECT 
  used_by,
  COUNT(*) as codes_used
FROM codes
WHERE used_at > NOW() - INTERVAL '7 days'
GROUP BY used_by
HAVING COUNT(*) > 5
ORDER BY codes_used DESC;
```

**Alert:** Same user activating > 10 codes in one day

**Actions:**
- Investigate potential abuse
- Review code generation process
- Check for code sharing/selling

---

### 4. User Registration Patterns

**Check:** Unusual registration spikes

```sql
-- Check new user registrations
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users
FROM users
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Alert:** > 3x average daily registrations

**Actions:**
- Check for bot registrations
- Review Telegram bot logs
- Verify authentication flow

---

## Monthly Monitoring

### 1. Security Audit

**Run:** Complete security test suite

```bash
# 1. Secret scanning
./test_scripts/scan_secrets.sh

# 2. Security tests
API_URL=https://your-app.vercel.app ./test_scripts/security_tests.sh

# 3. Production readiness
./test_scripts/production_readiness.sh
```

**Actions:**
- Document any new findings
- Update security measures
- Review and update this guide

---

### 2. Dependency Updates

**Check:** Outdated and vulnerable packages

```bash
# Check for vulnerabilities
npm audit

# Check for outdated packages
npm outdated

# Update packages
npm update

# Update major versions (carefully)
npm install <package>@latest
```

**Actions:**
- Apply security patches immediately
- Test thoroughly after updates
- Update dependencies one at a time for major versions

---

### 3. Access Review

**Check:** Who has access to critical systems

#### Review:
- [ ] Vercel project members
- [ ] Supabase project members
- [ ] GitHub repository access
- [ ] Enot.io dashboard access
- [ ] Environment variable access

**Actions:**
- Remove inactive team members
- Verify role assignments
- Review API key usage
- Rotate keys if necessary

---

### 4. Backup Verification

**Check:** Database backups and restoration

#### Verify:
- [ ] Supabase automatic backups enabled
- [ ] Backup retention period (7-30 days)
- [ ] Test restoration procedure (quarterly)

**Location:** Supabase Dashboard → Database → Backups

**Actions:**
- Document backup schedule
- Test restore procedure
- Verify data integrity

---

## Quarterly Monitoring

### 1. Comprehensive Security Review

**Conduct:** Full security audit (4-8 hours)

#### Review Areas:
- [ ] RLS policies still effective
- [ ] Authentication mechanisms secure
- [ ] Payment processing secure
- [ ] API endpoints properly protected
- [ ] Secret key rotation (if needed)
- [ ] Code quality (security-focused)
- [ ] Third-party integrations secure

**Deliverable:** Updated security audit report

---

### 2. Penetration Testing

**Conduct:** Professional penetration test (recommended)

#### Test Areas:
- [ ] Authentication bypass attempts
- [ ] Authorization vulnerabilities
- [ ] SQL injection
- [ ] XSS attacks
- [ ] CSRF attacks
- [ ] API abuse
- [ ] Rate limiting effectiveness

**Alternative:** Self-testing using security test suite

---

### 3. Compliance Review

**Check:** Regulatory compliance (if applicable)

#### Areas:
- [ ] GDPR (if EU users)
- [ ] PCI DSS (payment processing)
- [ ] Data protection laws
- [ ] Privacy policy up-to-date
- [ ] Terms of service current

---

## Incident Detection

### Indicators of Compromise (IoCs)

Watch for these warning signs:

#### 1. Authentication Anomalies
- Sudden spike in failed login attempts
- Successful logins from unusual locations
- Multiple tokens generated for same user rapidly

#### 2. Database Anomalies
- Unusual query patterns
- Unexpected data modifications
- RLS policy violations
- Slow query performance

#### 3. Payment Anomalies
- Unusual payment amounts
- High rate of failed payments
- Webhook signature failures
- Duplicate order IDs

#### 4. API Anomalies
- Rate limit triggers from many IPs
- Malformed requests (validation errors spike)
- Unusual error rates (500 errors)
- Suspicious user agents

---

## Alerting Setup

### Recommended Alerts

#### Vercel Alerts
- Deployment failures
- High error rates (> 1% of requests)
- Slow response times (> 3s)

**Setup:** Vercel Dashboard → Settings → Alerts

#### Supabase Alerts
- Database CPU > 80%
- Storage > 80%
- Connection pool exhausted

**Setup:** Supabase Dashboard → Settings → Alerts

#### Custom Alerts (via scripts)
```bash
#!/bin/bash
# alert_on_errors.sh
# Run via cron every 15 minutes

ERROR_COUNT=$(vercel logs --since 15m | grep -i "error" | wc -l)
THRESHOLD=50

if [ $ERROR_COUNT -gt $THRESHOLD ]; then
  echo "ALERT: $ERROR_COUNT errors in last 15 minutes" | mail -s "Error Alert" security@yourcompany.com
fi
```

---

## Key Rotation Schedule

### Secret Keys Rotation

| Key | Rotation Frequency | Procedure |
|-----|-------------------|-----------|
| SUPABASE_SERVICE_ROLE_KEY | Every 6 months | Supabase Dashboard → Settings → API |
| ENOT_SECRET_KEY | Every 6 months | Enot.io Dashboard → Settings |
| ENOT_SECRET_KEY_2 | Every 6 months | Enot.io Dashboard → Settings |
| TELEGRAM_BOT_TOKEN | On compromise only | @BotFather → /token |

### Rotation Procedure

1. **Generate new key** in service dashboard
2. **Update Vercel environment variables**
3. **Deploy** new version
4. **Test** critical functionality
5. **Monitor** for errors
6. **Revoke old key** after 24 hours (grace period)
7. **Document** in change log

---

## Log Analysis

### Important Log Patterns

#### Security Events to Monitor

```bash
# Failed authentication
vercel logs | grep "401" | grep "verify-token"

# Rate limiting
vercel logs | grep "429"

# Server errors
vercel logs | grep "500"

# Validation errors
vercel logs | grep "400" | grep "Validation"

# Webhook failures
vercel logs | grep "webhook" | grep -i "error"

# Suspicious patterns
vercel logs | grep -E "SQL|<script>|SELECT \*|DROP TABLE"
```

### Log Retention

- **Vercel Logs:** 7 days (free plan), 30 days (paid)
- **Supabase Logs:** 7 days (free plan), 90 days (paid)
- **Recommendation:** Export critical logs for longer retention

```bash
# Export logs monthly
vercel logs --since 30d > logs_$(date +%Y-%m).txt
```

---

## Security Metrics Dashboard

### Key Performance Indicators (KPIs)

Track these metrics monthly:

| Metric | Target | Current |
|--------|--------|---------|
| Authentication success rate | > 98% | ___ |
| API error rate | < 1% | ___ |
| Payment success rate | > 95% | ___ |
| Average response time | < 500ms | ___ |
| Rate limit triggers | < 10/day | ___ |
| Security scan pass rate | 100% | ___ |
| Dependency vulnerabilities | 0 critical | ___ |

### Generate Report

```bash
#!/bin/bash
# monthly_security_report.sh

echo "=== Monthly Security Report ==="
echo "Date: $(date)"
echo ""

echo "1. Secret Scan Results:"
./test_scripts/scan_secrets.sh

echo ""
echo "2. Production Readiness:"
./test_scripts/production_readiness.sh

echo ""
echo "3. Dependency Audit:"
npm audit --audit-level=high

echo ""
echo "4. Recent Errors:"
vercel logs --since 30d | grep -i "error" | wc -l
```

---

## Contact Information

### Security Team
- **Primary Contact:** security@yourcompany.com
- **Emergency Contact:** +X-XXX-XXX-XXXX
- **On-Call Schedule:** [Link to schedule]

### Vendor Support
- **Vercel Support:** support@vercel.com
- **Supabase Support:** support@supabase.io
- **Enot.io Support:** [Dashboard contact form]

---

## Appendix: Quick Reference Commands

### Daily Checks
```bash
# Check for errors
vercel logs --follow | grep -i "error"

# Check authentication failures
vercel logs | grep "401" | tail -20

# Check rate limits
vercel logs | grep "429" | tail -20
```

### Weekly Checks
```bash
# Run secret scan
./test_scripts/scan_secrets.sh

# Check production readiness
./test_scripts/production_readiness.sh

# Check dependencies
npm audit
```

### Monthly Checks
```bash
# Full security test
API_URL=https://your-app.vercel.app ./test_scripts/security_tests.sh

# Update dependencies
npm update && npm audit fix

# Generate security report
./monthly_security_report.sh > report_$(date +%Y-%m).txt
```

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-25 | 1.0 | Initial security monitoring guide |

---

**Next Review:** January 25, 2026

