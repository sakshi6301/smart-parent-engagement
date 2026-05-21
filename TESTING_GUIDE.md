# SCOPE — Testing Guide for Security Improvements

## Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- AI service running on `http://localhost:8000`
- MongoDB connected
- `.env` files configured with new variables

---

## Test 1: JWT Token Expiration & Refresh

### Setup
1. Update `.env` to test quickly:
   ```env
   JWT_EXPIRES_IN=1m  # 1 minute for testing
   ```
2. Restart backend server

### Test Steps
1. Login at `http://localhost:3000/login`
2. Open browser DevTools → Application → Cookies
3. Verify `refreshToken` cookie exists (httpOnly, 30 days expiry)
4. Open DevTools → Console
5. Check localStorage → `token` exists
6. Wait 1 minute (token expires)
7. Navigate to any protected page (e.g., `/teacher/attendance`)
8. Watch Network tab → should see:
   - Original request fails with 401
   - Automatic call to `/auth/refresh-token`
   - Original request retries with new token
   - Page loads successfully
9. Check localStorage → `token` has new value

### Expected Result
✅ Token automatically refreshed without user seeing any error  
✅ User stays logged in seamlessly  
✅ No redirect to login page

### Cleanup
Reset `.env`:
```env
JWT_EXPIRES_IN=7d
```

---

## Test 2: Logout & Token Revocation

### Test Steps
1. Login at `http://localhost:3000/login`
2. Note the `refreshToken` cookie value
3. Click Logout
4. Check DevTools → Cookies → `refreshToken` should be cleared
5. Try to manually call refresh endpoint:
   ```javascript
   // In browser console
   fetch('http://localhost:5000/api/auth/refresh-token', {
     method: 'POST',
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   ```
6. Should return error: "No refresh token" or "Invalid refresh token"

### Expected Result
✅ Refresh token cleared from cookie  
✅ Refresh token cleared from database  
✅ Cannot refresh after logout

---

## Test 3: CORS Restriction

### Test Steps
1. Open a different website (e.g., `https://example.com`)
2. Open browser console
3. Try to call SCOPE API:
   ```javascript
   fetch('http://localhost:5000/api/students')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```
4. Should see CORS error in console

### Expected Result
✅ Request blocked by CORS policy  
✅ Error message: "Access to fetch at 'http://localhost:5000/api/students' from origin 'https://example.com' has been blocked by CORS policy"

### Verify Allowed Origin Works
1. Go to `http://localhost:3000`
2. Login
3. Navigate to any page
4. All API calls work normally

---

## Test 4: Password Reset Flow

### Test Steps

#### Request Reset
1. Go to `http://localhost:3000/login`
2. Click "Forgot password?"
3. Enter a valid user email (e.g., `teacher@school.com`)
4. Click "Send Reset Email"
5. Check email inbox (or check server logs for email content)
6. Copy the reset link from email

#### Reset Password
1. Open the reset link in browser (format: `/reset-password/{token}`)
2. Enter new password: `NewPass123`
3. Confirm password: `NewPass123`
4. Click "Reset Password"
5. Should see success message
6. Auto-redirected to login after 3 seconds

#### Verify New Password
1. Login with email and new password `NewPass123`
2. Should login successfully

#### Test Token Expiration
1. Request another reset link
2. Wait 16 minutes (token expires after 15 min)
3. Try to use the expired link
4. Should see error: "Token is invalid or has expired"

### Expected Result
✅ Reset email sent with unique token  
✅ Token works within 15 minutes  
✅ Password successfully changed  
✅ Can login with new password  
✅ Token expires after 15 minutes  
✅ Token is single-use (cleared after successful reset)

---

## Test 5: Concurrent Request Queuing During Token Refresh

### Test Steps
1. Update `.env`: `JWT_EXPIRES_IN=30s`
2. Restart backend
3. Login
4. Open DevTools → Network tab
5. Wait 30 seconds for token to expire
6. Quickly navigate to multiple pages or trigger multiple API calls
7. Watch Network tab

### Expected Result
✅ First 401 triggers refresh  
✅ Subsequent 401s are queued (not triggering multiple refreshes)  
✅ All queued requests retry after refresh completes  
✅ All requests succeed

---

## Test 6: File Upload (Homework Submission)

### Test Steps
1. Login as teacher
2. Create a homework assignment
3. Logout, login as student
4. Go to homework page
5. Click "Submit" on the assignment
6. Attach a PDF file
7. Submit
8. Verify file appears in submission
9. Check `scope-backend/uploads/` folder → file should be saved

### Expected Result
✅ File uploaded successfully  
✅ File URL stored in database  
✅ File accessible via `/uploads/{filename}`

---

## Test 7: Internationalization (i18n)

### Test Steps
1. Login as any user
2. Open browser console
3. Change language:
   ```javascript
   localStorage.setItem('i18nextLng', 'hi')
   window.location.reload()
   ```
4. UI should display in Hindi
5. Change to Marathi:
   ```javascript
   localStorage.setItem('i18nextLng', 'mr')
   window.location.reload()
   ```
6. UI should display in Marathi

### Expected Result
✅ All UI text translates to Hindi  
✅ All UI text translates to Marathi  
✅ No missing translation keys

---

## Test 8: httpOnly Cookie Security

### Test Steps
1. Login
2. Open browser console
3. Try to access refresh token via JavaScript:
   ```javascript
   document.cookie
   ```
4. Should NOT see `refreshToken` in the output (httpOnly prevents JS access)

### Expected Result
✅ Refresh token not accessible via JavaScript  
✅ Protected from XSS attacks

---

## Test 9: Multiple Tab Sync

### Test Steps
1. Login in Tab 1
2. Open Tab 2 (same browser)
3. Navigate in Tab 2 → should work (shares localStorage token)
4. Logout in Tab 1
5. Try to navigate in Tab 2
6. Should be redirected to login (token cleared from localStorage)

### Expected Result
✅ Both tabs share authentication state  
✅ Logout in one tab affects all tabs

---

## Test 10: Production CORS Configuration

### Test Steps (Deploy to staging first)
1. Deploy backend to Railway/Render
2. Deploy frontend to Vercel
3. Update backend `.env`:
   ```env
   ALLOWED_ORIGIN=https://your-frontend.vercel.app
   ```
4. Test from frontend → should work
5. Test from different domain → should fail with CORS error

### Expected Result
✅ Only production frontend can access API  
✅ Other domains blocked by CORS

---

## Common Issues & Fixes

### Issue: "No refresh token" error after login
**Fix:** Make sure `cookie-parser` is installed and `app.use(cookieParser())` is before routes

### Issue: CORS error on localhost
**Fix:** Verify `ALLOWED_ORIGIN=http://localhost:3000` in `.env` (no trailing slash)

### Issue: Token refresh not working
**Fix:** Check `withCredentials: true` in Axios config and `credentials: true` in CORS config

### Issue: Password reset email not sending
**Fix:** Check `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` in `.env`

### Issue: Reset link 404
**Fix:** Verify route exists in `App.js`: `<Route path="/reset-password/:token" element={<ResetPassword />} />`

---

## Automated Test Script (Optional)

Create `test-security.js` in project root:

```javascript
const axios = require('axios');

const API = 'http://localhost:5000/api';

async function testTokenRefresh() {
  console.log('Testing token refresh...');
  
  // Login
  const { data } = await axios.post(`${API}/auth/login`, {
    email: 'teacher@school.com',
    password: 'Welcome@123'
  }, { withCredentials: true });
  
  console.log('✓ Login successful');
  
  // Wait for token to expire (if JWT_EXPIRES_IN=1m)
  console.log('Waiting 65 seconds for token to expire...');
  await new Promise(r => setTimeout(r, 65000));
  
  // Try protected route with expired token
  try {
    await axios.get(`${API}/students`, {
      headers: { Authorization: `Bearer ${data.token}` },
      withCredentials: true
    });
    console.log('✗ Should have failed with 401');
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('✓ Token expired as expected');
      
      // Refresh token
      const refresh = await axios.post(`${API}/auth/refresh-token`, {}, { withCredentials: true });
      console.log('✓ Token refreshed successfully');
      
      // Retry with new token
      await axios.get(`${API}/students`, {
        headers: { Authorization: `Bearer ${refresh.data.token}` }
      });
      console.log('✓ Request succeeded with new token');
    }
  }
}

testTokenRefresh().catch(console.error);
```

Run: `node test-security.js`

---

*All tests should pass before deploying to production.*
