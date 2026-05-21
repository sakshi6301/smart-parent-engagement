# SCOPE — Production Deployment Checklist

## Pre-Deployment Security Audit

### ✅ Environment Variables
- [ ] All secrets are strong random strings (min 32 characters)
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are different
- [ ] No hardcoded credentials in source code
- [ ] `.env` files are in `.gitignore`
- [ ] Production `.env` files never committed to Git

### ✅ CORS Configuration
- [ ] `ALLOWED_ORIGIN` set to production frontend URL
- [ ] No `origin: '*'` in production code
- [ ] `credentials: true` enabled for cookie support

### ✅ Token Security
- [ ] `JWT_EXPIRES_IN` set to reasonable value (7d recommended)
- [ ] Refresh tokens stored as httpOnly cookies
- [ ] `secure: true` flag on cookies in production
- [ ] `sameSite: 'strict'` on cookies

### ✅ Password Security
- [ ] bcrypt salt rounds = 10 or higher
- [ ] Password reset tokens expire (15 min)
- [ ] Reset tokens hashed before storage
- [ ] No default passwords in production data

### ✅ Database Security
- [ ] MongoDB connection uses authentication
- [ ] Database user has minimal required permissions
- [ ] Connection string uses SSL/TLS
- [ ] No public database access

### ✅ API Security
- [ ] All sensitive routes protected with `protect` middleware
- [ ] Role-based access control with `authorize` middleware
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured (optional but recommended)

---

## Deployment Steps

### 1. Backend Deployment (Railway/Render)

#### A. Prepare Repository
```bash
cd scope-backend
git init
git add .
git commit -m "Production ready backend"
```

#### B. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `scope-backend` folder
4. Railway auto-detects Node.js

#### C. Configure Environment Variables
Add these in Railway dashboard:

```env
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/scope_db?retryWrites=true&w=majority

# JWT
JWT_SECRET=<generate-strong-random-32-char-string>
JWT_REFRESH_SECRET=<generate-different-strong-random-32-char-string>
JWT_EXPIRES_IN=7d

# CORS & Frontend
ALLOWED_ORIGIN=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app

# Email (Brevo SMTP)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-brevo-smtp-user
EMAIL_PASS=your-brevo-smtp-password
EMAIL_FROM=noreply@yourschool.com

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# AI Service
AI_SERVICE_URL=https://your-ai-service.railway.app

# Misc
NODE_ENV=production
PORT=5000
```

#### D. Generate Strong Secrets
```bash
# In terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Run twice for JWT_SECRET and JWT_REFRESH_SECRET
```

#### E. Deploy
- Railway auto-deploys on push
- Get deployment URL: `https://scope-backend-production.up.railway.app`

---

### 2. AI Service Deployment (Railway/Render)

#### A. Prepare Repository
```bash
cd scope-ai-service
git init
git add .
git commit -m "Production ready AI service"
```

#### B. Deploy to Railway
1. New Project → Deploy from GitHub
2. Select `scope-ai-service` folder
3. Railway auto-detects Python

#### C. Configure Environment Variables
```env
PORT=8000
```

#### D. Deploy
- Get deployment URL: `https://scope-ai-service-production.up.railway.app`
- Update backend `AI_SERVICE_URL` with this URL

---

### 3. Frontend Deployment (Vercel)

#### A. Prepare Repository
```bash
cd scope-frontend
git init
git add .
git commit -m "Production ready frontend"
```

#### B. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" → Import Git Repository
3. Select `scope-frontend` folder
4. Vercel auto-detects React

#### C. Configure Environment Variables
Add in Vercel dashboard:

```env
REACT_APP_API_URL=https://scope-backend-production.up.railway.app/api
```

#### D. Deploy
- Vercel auto-deploys on push
- Get deployment URL: `https://scope-frontend.vercel.app`
- Update backend `ALLOWED_ORIGIN` and `FRONTEND_URL` with this URL

---

### 4. MongoDB Atlas Configuration

#### A. Whitelist IP Addresses
1. Go to MongoDB Atlas dashboard
2. Network Access → Add IP Address
3. Add Railway/Render IP ranges (or allow all: `0.0.0.0/0` for serverless)

#### B. Create Database User
1. Database Access → Add New Database User
2. Username: `scope_prod_user`
3. Password: Generate strong password
4. Role: `readWrite` on `scope_db`

#### C. Get Connection String
```
mongodb+srv://scope_prod_user:<password>@cluster.mongodb.net/scope_db?retryWrites=true&w=majority
```

---

### 5. Post-Deployment Verification

#### A. Health Checks
```bash
# Backend
curl https://scope-backend-production.up.railway.app/health
# Should return: {"status":"ok","service":"SCOPE Backend"}

# AI Service
curl https://scope-ai-service-production.up.railway.app/health
# Should return: {"status":"ok","service":"SCOPE AI Service"}
```

#### B. Test Authentication Flow
1. Go to `https://scope-frontend.vercel.app/login`
2. Login with test credentials
3. Verify token refresh works (wait for expiration)
4. Verify logout clears cookies

#### C. Test CORS
1. Open browser console on different domain
2. Try to call API → should fail with CORS error
3. From your frontend → should work

#### D. Test Password Reset
1. Click "Forgot password?"
2. Enter email
3. Check email inbox
4. Click reset link
5. Set new password
6. Login with new password

#### E. Test File Upload
1. Login as student
2. Submit homework with file attachment
3. Verify file uploads successfully

---

## Security Hardening (Optional but Recommended)

### 1. Rate Limiting
Install `express-rate-limit`:
```bash
npm install express-rate-limit
```

Add to `server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);
```

### 2. Helmet (Security Headers)
Install `helmet`:
```bash
npm install helmet
```

Add to `server.js`:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 3. MongoDB Indexes
Add indexes for frequently queried fields:
```javascript
// In models
attendanceSchema.index({ student: 1, date: -1 });
gradeSchema.index({ student: 1, examDate: -1 });
studentSchema.index({ class: 1, section: 1 });
```

### 4. Logging
Install `winston`:
```bash
npm install winston
```

Configure structured logging for production errors.

---

## Monitoring & Maintenance

### 1. Set Up Monitoring
- Railway/Render provide basic metrics
- Consider: Sentry for error tracking, LogRocket for session replay

### 2. Database Backups
- MongoDB Atlas auto-backups enabled
- Test restore process

### 3. SSL/TLS Certificates
- Vercel provides automatic HTTPS
- Railway/Render provide automatic HTTPS
- Verify all connections use HTTPS

### 4. Regular Updates
```bash
# Check for security updates
npm audit

# Update dependencies
npm update

# Fix vulnerabilities
npm audit fix
```

---

## Rollback Plan

### If Deployment Fails

#### Backend/AI Service (Railway)
1. Go to Railway dashboard
2. Deployments tab
3. Click "Rollback" on previous working deployment

#### Frontend (Vercel)
1. Go to Vercel dashboard
2. Deployments tab
3. Click "..." → "Promote to Production" on previous deployment

#### Database
1. MongoDB Atlas → Backups
2. Restore from snapshot

---

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
JWT_EXPIRES_IN=7d
```

### Staging
```env
NODE_ENV=staging
ALLOWED_ORIGIN=https://scope-staging.vercel.app
FRONTEND_URL=https://scope-staging.vercel.app
JWT_EXPIRES_IN=7d
```

### Production
```env
NODE_ENV=production
ALLOWED_ORIGIN=https://scope-frontend.vercel.app
FRONTEND_URL=https://scope-frontend.vercel.app
JWT_EXPIRES_IN=7d
```

---

## Custom Domain Setup (Optional)

### Frontend (Vercel)
1. Vercel dashboard → Settings → Domains
2. Add custom domain: `scope.yourschool.com`
3. Update DNS records as instructed
4. SSL auto-provisioned

### Backend (Railway)
1. Railway dashboard → Settings → Domains
2. Add custom domain: `api.yourschool.com`
3. Update DNS records
4. SSL auto-provisioned

### Update Environment Variables
```env
# Backend
ALLOWED_ORIGIN=https://scope.yourschool.com
FRONTEND_URL=https://scope.yourschool.com

# Frontend
REACT_APP_API_URL=https://api.yourschool.com/api
```

---

## Final Checklist Before Going Live

- [ ] All environment variables configured
- [ ] CORS restricted to production domain
- [ ] JWT secrets are strong and different
- [ ] Database connection secured
- [ ] Health checks passing
- [ ] Login/logout working
- [ ] Token refresh working
- [ ] Password reset working
- [ ] File upload working
- [ ] Email notifications working
- [ ] Push notifications working (if Firebase configured)
- [ ] AI predictions working
- [ ] All 4 user roles tested
- [ ] Mobile responsive design verified
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] SSL certificates active
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Admin credentials secured

---

## Support & Troubleshooting

### Common Production Issues

**Issue: CORS errors**
- Verify `ALLOWED_ORIGIN` matches frontend URL exactly (no trailing slash)
- Check `credentials: true` in both CORS and Axios config

**Issue: Cookies not being set**
- Verify `secure: true` only in production (not localhost)
- Check `sameSite` attribute
- Ensure frontend and backend on same root domain or use proper CORS

**Issue: Token refresh fails**
- Check `JWT_REFRESH_SECRET` is set
- Verify `cookie-parser` middleware is loaded
- Check cookie expiration

**Issue: Email not sending**
- Verify SMTP credentials
- Check Brevo account limits (300/day on free tier)
- Look for email in spam folder

**Issue: AI predictions fail**
- Check `AI_SERVICE_URL` is correct
- Verify AI service is running
- Backend falls back to rule-based logic if AI fails

---

*Deployment complete! Monitor logs for first 24 hours and address any issues promptly.*
