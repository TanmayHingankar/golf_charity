# 🚀 GOLF CHARITY PLATFORM - DEPLOYMENT GUIDE
# Par for Purpose - Complete Deployment Instructions

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Environment Variables Ready
- [ ] DATABASE_URL configured
- [ ] SESSION_SECRET generated (32 chars)
- [ ] STRIPE_SECRET_KEY & WEBHOOK_SECRET
- [ ] SMTP credentials configured
- [ ] CLOUDINARY credentials ready
- [ ] FRONTEND_URL set correctly

### ✅ Code Quality Checks
- [ ] All TypeScript errors resolved
- [ ] Build passes successfully
- [ ] Tests pass (if any)
- [ ] Security audit completed

### ✅ Services Provisioned
- [ ] PostgreSQL database created
- [ ] Stripe account configured
- [ ] Email service ready
- [ ] Cloudinary account set up
- [ ] GitHub repository created

---

## 🗄️ STEP 1: DATABASE SETUP (PostgreSQL)

### Option A: Supabase (Recommended - Free Tier Available)
1. Go to https://supabase.com
2. Create new account → New Project
3. Choose organization → Project name: "golf-charity-prod"
4. Database Password: Generate strong password
5. Region: Select closest to your users
6. Wait for setup completion (2-3 minutes)

**Copy these values:**
- Project URL: `https://xxxxx.supabase.co`
- Database Password: `your-generated-password`
- API Keys: From Settings → API

**DATABASE_URL Format:**
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Option B: Railway PostgreSQL
1. Go to https://railway.app
2. Create project → Add PostgreSQL
3. Copy DATABASE_URL from Variables tab

### Option C: Local PostgreSQL (Development Only)
```bash
createdb golf_charity_prod
# DATABASE_URL=postgresql://postgres:password@localhost:5432/golf_charity_prod
```

---

## 💳 STEP 2: STRIPE PAYMENT SETUP

### 1. Create Stripe Account
1. Go to https://stripe.com → Start now
2. Complete business verification
3. Enable test mode initially

### 2. Get API Keys
1. Dashboard → Developers → API keys
2. **Publishable key**: `pk_live_...` (for frontend)
3. **Secret key**: `sk_live_...` (for backend) - ⚠️ Keep secret!

### 3. Configure Webhooks
1. Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend.onrender.com/api/subscriptions/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
4. Copy **Webhook signing secret**: `whsec_...`

### 4. Create Products & Prices
1. Dashboard → Products
2. Create "Monthly Subscription" → Price: £19.99/month
3. Create "Yearly Subscription" → Price: £199.99/year

---

## 📧 STEP 3: EMAIL SERVICE SETUP

### Option A: Gmail SMTP (Free)
1. Enable 2FA on Gmail account
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Environment Variables:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### Option B: SendGrid (Free Tier: 100 emails/day)
1. Go to https://sendgrid.com → Sign up
2. Verify single sender
3. Create API key
4. **Environment Variables:**
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

---

## 📸 STEP 4: CLOUDINARY FILE UPLOAD SETUP

1. Go to https://cloudinary.com → Sign up
2. Dashboard → Account Details
3. **Copy credentials:**
   - Cloud name
   - API Key
   - API Secret

**Environment Variables:**
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 🔐 STEP 5: GENERATE SECURE SECRETS

### Session Secret (32 characters)
```bash
# Generate random 32-char string
openssl rand -base64 32
# OR use: https://www.uuidgenerator.net/
```

### Environment Variables Summary
```bash
# Copy .env.production.example to .env
cp .env.production.example .env

# Edit with your actual values:
DATABASE_URL=postgresql://...
SESSION_SECRET=your-32-char-secret...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 🚀 STEP 6: GITHUB REPOSITORY SETUP

### 1. Create GitHub Repository
1. Go to https://github.com → New repository
2. Repository name: `golf-charity-platform`
3. Description: "Par for Purpose - Golf Charity Subscription Platform"
4. Make it **Public** or **Private**
5. ⚠️ **DO NOT** initialize with README (we already have one)

### 2. Push Code to GitHub
```bash
# If not already done:
git init
git add .
git commit -m "Initial commit: Golf Charity Platform"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/golf-charity-platform.git

# Push to GitHub
git push -u origin main
```

### 3. Verify Repository Structure
Your GitHub repo should contain:
```
artifacts/
├── api-server/     # Backend code
├── golf-platform/  # Frontend code
└── mockup-sandbox/ # Additional UI
lib/                # Shared libraries
.env.example        # Environment template
pnpm-workspace.yaml # Workspace config
README.md          # Project documentation
```

---

## 🔧 STEP 7: BACKEND DEPLOYMENT (Render)

### 1. Create Render Account
1. Go to https://render.com → Sign up
2. Connect GitHub account
3. Authorize Render to access repositories

### 2. Deploy Backend
1. Dashboard → New → Web Service
2. Connect GitHub repository
3. **Repository**: `YOUR_USERNAME/golf-charity-platform`
4. **Branch**: `main`

### 3. Configure Build Settings
```
Name: golf-charity-api
Environment: Node
Build Command: pnpm install && pnpm run build
Start Command: pnpm run start
Root Directory: artifacts/api-server
```

### 4. Add Environment Variables
Copy all variables from your `.env` file:

```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-32-char-secret...
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 5. Deploy
1. Click "Create Web Service"
2. Wait for build completion (3-5 minutes)
3. **Copy the URL**: `https://golf-charity-api.onrender.com`

---

## 🎨 STEP 8: FRONTEND DEPLOYMENT (Vercel)

### 1. Create Vercel Account
1. Go to https://vercel.com → Sign up
2. Connect GitHub account

### 2. Deploy Frontend
1. Dashboard → Add New... → Project
2. Import GitHub repository
3. **Repository**: `YOUR_USERNAME/golf-charity-platform`

### 3. Configure Build Settings
```
Framework Preset: Vite
Root Directory: artifacts/golf-platform
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install
```

### 4. Add Environment Variables
```
VITE_API_URL=https://golf-charity-api.onrender.com/api
```

### 5. Deploy
1. Click "Deploy"
2. Wait for build completion (2-3 minutes)
3. **Copy the URL**: `https://golf-charity-platform.vercel.app`

---

## 🔗 STEP 9: CONNECT FRONTEND TO BACKEND

### Update CORS in Backend
1. Go to Render dashboard → Your backend service
2. Environment → Add/Edit variable:
   ```
   CORS_ORIGIN=https://golf-charity-platform.vercel.app
   FRONTEND_URL=https://golf-charity-platform.vercel.app
   ```
3. **Redeploy** backend

### Test API Connection
1. Open frontend URL
2. Check browser console for API errors
3. Try registration/login

---

## 🗃️ STEP 10: DATABASE INITIALIZATION

### Push Database Schema
```bash
# Locally test first:
pnpm --filter @workspace/db run push

# For production, you might need to run this via Render shell
# OR create a migration script
```

### Seed Initial Data
```bash
# Run seed script:
pnpm --filter @workspace/api-server run seed

# This creates:
# - Admin user: admin@parforpurpose.com
# - Sample charities
# - Test data
```

---

## ✅ STEP 11: FINAL TESTING CHECKLIST

### Backend Tests
- [ ] API responds: `GET https://your-api.onrender.com/api/health`
- [ ] Database connection works
- [ ] Authentication endpoints work

### Frontend Tests
- [ ] Homepage loads
- [ ] Registration works
- [ ] Login works
- [ ] Dashboard accessible

### Integration Tests
- [ ] User registration → Welcome email sent
- [ ] Score submission works
- [ ] Admin panel accessible
- [ ] Charity selection works

### Payment Tests (Stripe Test Mode)
- [ ] Subscription creation works
- [ ] Webhook events processed
- [ ] Status updates correctly

---

## 🎯 PRODUCTION URLs

After successful deployment:

**Frontend:** `https://golf-charity-platform.vercel.app`
**Backend:** `https://golf-charity-api.onrender.com`
**Database:** Your PostgreSQL provider URL

---

## 🆘 TROUBLESHOOTING

### Common Issues:

**Build Fails:**
- Check environment variables are set correctly
- Verify database URL format
- Check for TypeScript errors

**API Connection Issues:**
- Verify CORS_ORIGIN matches frontend URL
- Check VITE_API_URL in frontend
- Test backend health endpoint

**Database Issues:**
- Verify DATABASE_URL is correct
- Check database permissions
- Run schema push manually

**Email Issues:**
- Verify SMTP credentials
- Check Gmail app password
- Test with simple email first

---

## 💰 COST ESTIMATES

**Free Tier Limits:**
- Render: 750 hours/month (~$0)
- Vercel: 100GB bandwidth/month (~$0)
- Supabase: 500MB database (~$0)
- SendGrid: 100 emails/day (~$0)
- Cloudinary: 25GB storage (~$0)

**Paid Upgrades (if needed):**
- Render: $7/month for persistent apps
- Supabase: $25/month for 1GB database
- SendGrid: $20/month for 50K emails
- Cloudinary: $10/month for 100GB storage

---

## 🎉 DEPLOYMENT COMPLETE!

Your Golf Charity Platform is now live and ready for users!

**Next Steps:**
1. Create test users
2. Test all features
3. Set up monitoring
4. Configure domain (optional)
5. Start marketing campaign