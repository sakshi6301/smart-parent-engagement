# SCOPE — Complete Interview Preparation Guide
### Smart Continuous Parent Engagement System
*Built by Sneha Hudge — Final Year Engineering Project*

---

## 1. PROJECT INTRODUCTION (30-second pitch)

> "SCOPE is a full-stack school communication platform I built as my final year project. It replaces physical diaries and WhatsApp groups with a proper system where teachers mark attendance and upload grades, parents get instant push and email notifications, and there's real-time chat between teachers and parents. The unique part is the AI service — a separate Python Flask microservice that predicts which students are academically at risk using Random Forest, forecasts grade trends using Linear Regression, and detects unusual attendance patterns using Isolation Forest. The stack is React + Node.js + MongoDB + Python Flask, with Socket.io for real-time features and Firebase for push notifications."

---

## 2. ARCHITECTURE DEEP DIVE

### System Architecture

```
Browser (React :3000)
        │
        ├── REST API calls ──► Node.js / Express (:5000)
        │                              │
        │                              ├── MongoDB Atlas (cloud DB)
        │                              ├── Firebase FCM (push notifications)
        │                              ├── Brevo SMTP (email)
        │                              └── HTTP calls ──► Python Flask AI (:8000)
        │
        └── WebSocket (Socket.io) ──► Node.js server (real-time chat)
```

### Three-Service Microservice Design

| Service | Tech | Port | Responsibility |
|---------|------|------|----------------|
| scope-frontend | React + Tailwind + Chart.js | 3000 | UI for all 4 roles |
| scope-backend | Node.js + Express + Socket.io | 5000 | REST API, auth, business logic |
| scope-ai-service | Python Flask + scikit-learn | 8000 | ML predictions |

**Why separate the AI service?**
- Python has a richer ML ecosystem (scikit-learn, numpy, pandas) than Node.js
- The AI service can be scaled, updated, or retrained independently
- If the AI service goes down, the backend falls back to rule-based logic (see `aiController.js` — the `getAllRisks` function has a try/catch that computes a weighted score manually if the Flask call fails)

---

## 3. DATABASE DESIGN

### MongoDB Collections & Key Schemas

**User** — all system users (admin, teacher, parent, student)
```
{ name, email, password (bcrypt hashed), role, phone, fcmToken, language, isActive }
```

**Student** — rich student profile (50+ fields)
```
{ name, rollNumber, class, section, academicYear, parent (ref: User), teacher (ref: User),
  studentUser (ref: User), fatherName, motherName, medicalConditions, transportMode, ... }
```

**Attendance**
```
{ student (ref), teacher (ref), date, status: ['present','absent','late'], notificationSent }
Compound unique index: { student: 1, date: 1 } — prevents duplicate records for same day
```

**Grade**
```
{ student, teacher, subject, examType: ['unit_test','midterm','final','assignment'],
  marksObtained, totalMarks, grade, remarks, examDate }
Virtual field: percentage = (marksObtained / totalMarks) * 100
```

**Message** — chat messages
```
{ roomId, sender (ref: User), content, type, fileUrl }
```

**Meeting** — parent-teacher meeting requests
```
{ parent, teacher, student, requestedSlot, confirmedSlot, status, reason }
```

**Notification**
```
{ recipient, title, body, type, channels: ['push','email'], isRead, relatedStudent }
```

### Why MongoDB over SQL?
- Student schema has many optional fields (medical, transport, guardian) — document model handles sparse data better than nullable SQL columns
- Flexible enough to add new fields without migrations during development
- MongoDB Atlas free tier was sufficient for a demo project

---

## 4. AUTHENTICATION & SECURITY

### JWT Flow
```
Login → server verifies bcrypt hash → generates JWT (signed with JWT_SECRET)
       → client stores token → sends as "Authorization: Bearer <token>" header
       → protect middleware verifies token on every protected route
```

### Middleware Chain (from `auth.js`)
```javascript
// protect — verifies JWT, attaches req.user
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findById(decoded.id).select('-password');

// authorize — role-based access control
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403)...
}
```

**Example route protection:**
```javascript
router.post('/attendance', protect, authorize('teacher', 'admin'), markAttendance);
router.get('/ai/risk/:studentId', protect, authorize('teacher', 'admin'), predictRisk);
```

### Password Security
- bcrypt with salt rounds = 10 (in User model `pre('save')` hook)
- Password only hashed when modified (`if (!this.isModified('password')) return next()`)
- Default password for bulk-imported users: `Welcome@123` — users are prompted to change it

### Security Considerations I'm Aware Of
- JWT tokens don't expire (known limitation — should add `expiresIn: '7d'`)
- No refresh token mechanism yet
- CORS is set to `origin: '*'` — should be restricted to frontend domain in production
- Forgot password resets to a fixed temp password instead of a unique token link

---

## 5. ATTENDANCE MODULE

### Mark Attendance Flow (`attendanceController.js`)
1. Teacher sends `POST /api/attendance` with `{ records: [{studentId, status}], date }`
2. For each record, `findOneAndUpdate` with `upsert: true` — idempotent, teacher can re-mark
3. If status is `absent` AND `notificationSent` is false:
   - Fetch student → find linked parent
   - Create Notification document
   - Send Firebase push notification
   - Send email via Brevo SMTP
   - Set `notificationSent = true` to prevent duplicate alerts

### Get Attendance with Summary
```javascript
// Returns records + computed summary
{ records, summary: { total, present, absent, percentage } }
// Supports ?month=2024-11 query param for monthly filtering
```

### Why `upsert: true`?
Prevents duplicate attendance records. If a teacher accidentally marks twice, it updates instead of creating a second document. The compound unique index `{ student: 1, date: 1 }` also enforces this at the DB level.

---

## 6. GRADE MODULE

### Add Grade Flow (`gradeController.js`)
1. `POST /api/grades` creates grade document
2. Immediately calculates percentage: `(marksObtained / totalMarks) * 100`
3. Sends push + email notification to parent
4. Notification is wrapped in try/catch — grade save never fails due to notification failure

### Subject Summary
`getStudentGrades` groups grades by subject into a `subjectMap`:
```javascript
{ "Mathematics": [{ examType, percentage, marks, date }, ...], "Science": [...] }
```
This powers the subject-wise performance charts on the frontend.

---

## 7. REAL-TIME CHAT (Socket.io)

### Architecture
- Socket.io server runs on the same HTTP server as Express (shared port 5000)
- `io` instance is stored on the Express app: `app.set('io', io)`
- Controllers access it via `req.app.get('io')`

### Room-based Chat
```javascript
// Client joins a room (roomId = "teacher_<teacherId>_parent_<parentId>")
socket.on('joinRoom', (roomId) => socket.join(roomId));

// When message is sent via REST API, server emits to room
req.app.get('io').to(roomId).emit('newMessage', populated);
```

### Why REST + Socket.io hybrid?
- Message is saved to MongoDB via REST (persistence)
- Then emitted via Socket.io (real-time delivery)
- If the other user is offline, they get the message from MongoDB when they next load the chat

### Engagement Tracking
When a parent sends a message, `updateEngagement` is called to increment their engagement score — this feeds into the AI engagement scoring system.

---

## 8. NOTIFICATION SYSTEM

### Dual Channel (Push + Email)
Every important event triggers both:
```javascript
await sendPush(parent.fcmToken, title, body);        // Firebase FCM
await sendEmail({ to: parent.email, subject, html }); // Brevo SMTP
```

### Firebase Push (`sendPush.js`)
- Uses Firebase Admin SDK with `FIREBASE_SERVER_KEY`
- Sends to parent's `fcmToken` stored in User document
- Token is updated when parent logs in on a new device via `PUT /api/auth/fcm-token`

### Email (`sendEmail.js` + Brevo SMTP)
- Nodemailer configured with Brevo SMTP credentials
- HTML email templates in `emailTemplate.js` and `emailTemplate.js`
- Skips emails for `@scope.internal` addresses (bulk-imported users without real emails)

### Weekly Digest
- Cron job scheduled with `node-cron` in `weeklyDigest.js`
- Runs every Sunday, sends each parent a summary of their child's week
- Can be manually triggered via `POST /api/admin/send-weekly-digest`

---

## 9. AI SERVICE — DETAILED

### Risk Prediction (Random Forest)

**Features used:**
| Feature | Weight in label formula |
|---------|------------------------|
| attendance_pct | 40% |
| avg_grade | 40% |
| hw_completion_rate | 20% |

**Labels:** `high` (score < 45), `medium` (45–70), `low` (≥ 70)

**Training:**
- Default: 500 synthetic samples generated with `numpy.random`
- Can be retrained with real CSV via admin upload
- Model saved as `risk_model.pkl` using `joblib`
- 5-fold cross-validation accuracy reported on training

**Prediction flow:**
```
Node.js aiController → POST /predict/risk (Flask) → load_model() → RandomForest.predict()
→ returns { risk_level, confidence }
```

**Fallback:** If Flask is unreachable, Node.js computes:
```javascript
const score = (attendancePct * 0.4) + (avgGrade * 0.4) + (hwCompletionRate * 0.2);
risk_level = score < 40 ? 'high' : score < 65 ? 'medium' : 'low';
```

### Grade Trend Forecasting (Linear Regression)

```python
# scores = list of percentages in chronological order
X = np.arange(len(scores)).reshape(-1, 1)  # [0, 1, 2, 3...]
model = LinearRegression().fit(X, scores)
predicted_next = model.predict([[len(scores)]])

# Direction based on slope
if slope > 1.5:  direction = 'improving'
elif slope < -1.5: direction = 'declining'
else: direction = 'stable'
```

Returns per-subject: `{ predicted_next_score, direction, slope }`

### Attendance Anomaly Detection (Isolation Forest)

```python
# Converts daily records to rolling 7-day windows
# Each window = [mean_attendance, min_attendance, absence_count]
model = IsolationForest(contamination=0.1)
# contamination=0.1 means ~10% of patterns expected to be anomalous

# Additional rule-based checks layered on top:
# - 3+ absences in last 7 days → frequent_absence
# - below 75% overall → below_threshold
# - sudden change detected by model → sudden_drop
```

### Engagement Scoring (Weighted Formula)

```python
score = (
    min(login_count, 20) / 20 * 25 +        # login frequency (25 pts)
    min(chat_replies, 10) / 10 * 25 +        # chat responsiveness (25 pts)
    min(meetings_attended, 3) / 3 * 20 +     # meeting participation (20 pts)
    min(hw_acknowledged, 10) / 10 * 15 +     # homework acknowledgement (15 pts)
    min(notif_open_rate, 100) / 100 * 15     # notification open rate (15 pts)
)
# Levels: Highly Engaged (≥75), Moderately Engaged (≥45), Low Engagement (<45)
```

### Learning Recommendations (Rule-Based)
- Identifies subjects where `avg_grade < 60%` as weak subjects
- Returns curated exercises, YouTube channels, and topic lists per subject
- Subjects covered: Mathematics, Science, English, History, Geography
- Falls back to generic study tips for unlisted subjects

---

## 10. BULK IMPORT MODULE

### CSV Import Flow
1. Admin uploads CSV file
2. `bulkImportParser.js` parses and validates rows
3. Creates Student documents
4. Optionally creates User accounts with `Welcome@123` password
5. For students without real emails, generates `rollNumber@scope.internal` placeholder
6. Admin can later send credentials email to real emails via `POST /api/auth/send-credentials/:id`

### `provisionStudentUsers` endpoint
Auto-creates User accounts for all students that don't have one yet — useful after bulk import.

---

## 11. PARENT ENGAGEMENT SCORING

### Data Sources (last 30 days)
- `login_count` — tracked on User model (`loginCount` field)
- `chat_replies` — incremented via `updateEngagement` helper when parent sends message
- `meetings_attended` — count of confirmed meetings
- `hw_acknowledged` — incremented when parent views homework
- `notifications_opened` — count of Notification docs where `isRead: true`

### Why this matters
Teachers can see which parents are disengaged and take action — call them, send SMS, or schedule a meeting. The system generates specific insights like "Parent rarely logs in — send re-engagement notification."

---

## 12. FRONTEND ARCHITECTURE

### Role-Based Routing
```javascript
// ProtectedRoute.js checks JWT + role
// Each role has its own page directory:
pages/admin/    → AdminDashboard, UserManagement, BulkImport, AnalyticsDashboard...
pages/teacher/  → Attendance, GradeManager, RiskMonitor, Chat, Meetings...
pages/parent/   → ParentDashboard, ParentGrades, ParentAttendance, ParentChat...
pages/student/  → StudentDashboard, StudentGrades, StudentHomework...
```

### State Management
- `AuthContext.js` — React Context for user session (no Redux, kept simple)
- `api.js` — Axios instance with base URL and JWT header injection
- `socket.js` — Socket.io client singleton

### Charts
- Chart.js via `react-chartjs-2`
- Used for: attendance trends, grade history per subject, engagement scores, admin analytics

### i18n
- `i18n.js` setup exists with `react-i18next`
- Supports English, Hindi, Marathi (language stored on User model)
- Translations incomplete — known limitation

---

## 13. DOCKER & DEPLOYMENT

### Docker Setup
All three services have `Dockerfile`s. `docker-compose.yml` at root orchestrates them:
```yaml
# Three services: frontend, backend, ai-service
# Backend depends on ai-service being healthy
# Environment variables injected via .env files
```

### Deployment Plan
| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend + AI | Railway or Render (free tier) |
| Database | MongoDB Atlas (already cloud) |

---

## 14. TECH STACK — WHAT EACH TECHNOLOGY IS & WHY I USED IT

---

### FRONTEND

**React.js**
React is a JavaScript library for building user interfaces. It works on a component-based model — you break the UI into small reusable pieces (like a StatCard, DataTable, Modal) and React efficiently updates only the parts of the page that change, instead of reloading the whole page. I used React because it's the industry standard for SPAs (Single Page Applications), it has a huge ecosystem, and it made building 4 separate role-based dashboards much easier by reusing components.

**Tailwind CSS**
Tailwind is a utility-first CSS framework. Instead of writing custom CSS classes, you apply small utility classes directly in HTML/JSX like `bg-blue-500`, `flex`, `rounded-lg`. This speeds up styling a lot and keeps the design consistent without writing a single CSS file. I used it because it's fast to prototype with and produces clean, responsive UIs without fighting with CSS specificity.

**Chart.js + react-chartjs-2**
Chart.js is a JavaScript charting library that renders graphs on an HTML canvas. `react-chartjs-2` is a React wrapper around it. I used it to display attendance trend graphs, subject-wise grade history, engagement score bars, and admin analytics dashboards. It supports line charts, bar charts, doughnut charts — all of which appear in SCOPE.

**React Router DOM**
This handles client-side routing in React — meaning navigating between pages without a full browser reload. I used it to define routes like `/teacher/attendance`, `/parent/grades`, `/admin/dashboard` and to build the `ProtectedRoute` component that redirects unauthenticated users to the login page.

**Axios**
Axios is an HTTP client library for making API calls from the browser. I used it instead of the native `fetch` because it automatically parses JSON responses, has cleaner error handling, and supports interceptors — I configured a base URL and automatically attach the JWT token to every request header in `api.js`.

**Socket.io-client**
This is the browser-side library that connects to the Socket.io server for real-time communication. It maintains a WebSocket connection and listens for events like `newMessage`. I used it for the parent-teacher chat feature so messages appear instantly without refreshing the page.

**i18next + react-i18next**
i18next is an internationalization framework. It lets you define translations for different languages and switch between them at runtime. I set it up to support English, Hindi, and Marathi (since SCOPE targets Indian schools). The language preference is stored on the User model. Full translations are a known incomplete item.

---

### BACKEND

**Node.js**
Node.js is a JavaScript runtime that lets you run JavaScript on the server side. It's built on Chrome's V8 engine and uses a non-blocking, event-driven architecture — meaning it can handle many simultaneous requests without creating a new thread for each one. I chose Node.js because it's fast for I/O-heavy applications (like reading from MongoDB, sending notifications), and using JavaScript on both frontend and backend reduces context switching.

**Express.js**
Express is a minimal web framework for Node.js. It provides routing, middleware support, and HTTP utilities. In SCOPE, every API endpoint (`/api/attendance`, `/api/grades`, etc.) is defined using Express routes. The middleware chain (`protect` → `authorize` → controller) is an Express pattern. Without Express, you'd have to handle all HTTP parsing manually.

**MongoDB + Mongoose**
MongoDB is a NoSQL document database — data is stored as JSON-like documents instead of rows and columns. Mongoose is an ODM (Object Data Modeling) library for MongoDB in Node.js — it lets you define schemas, add validations, create virtual fields, and write queries in a clean way. I used MongoDB because the student profile has 50+ optional fields that fit naturally into a document model, and Mongoose made it easy to define relationships between collections using `ref` and `populate`.

**MongoDB Atlas**
Atlas is MongoDB's cloud-hosted database service. Instead of running MongoDB locally, the database lives in the cloud. I used the free tier for development — it gives 512MB storage, automatic backups, and a connection string I just paste into `.env`.

**JWT (jsonwebtoken)**
JSON Web Tokens are a standard for securely transmitting authentication information. After login, the server signs a token containing the user's ID using a secret key. The client sends this token on every request. The server verifies it without hitting the database every time. I used JWT because it's stateless — no session storage needed on the server.

**bcryptjs**
bcrypt is a password hashing algorithm. It takes a plain text password and produces a one-way hash with a random salt. Even if the database is leaked, passwords can't be reversed. I used salt rounds = 10, which means the hashing runs 2^10 = 1024 iterations — slow enough to resist brute force but fast enough for normal login. The hashing happens automatically in the Mongoose `pre('save')` hook.

**Socket.io**
Socket.io is a library that enables real-time, bidirectional communication between the server and browser using WebSockets (with fallback to HTTP long-polling). I used it for the parent-teacher chat — when a message is sent, the server instantly pushes it to all users in that chat room without them needing to refresh.

**Firebase Admin SDK (firebase-admin)**
Firebase Cloud Messaging (FCM) is Google's service for sending push notifications to mobile and web browsers. The Admin SDK lets the Node.js server send notifications directly to a user's device using their FCM token. When a student is marked absent, the backend calls FCM and the parent's phone shows a push notification instantly.

**Nodemailer**
Nodemailer is a Node.js library for sending emails. It connects to any SMTP server. I configured it with Brevo's SMTP credentials to send HTML emails — absence alerts, grade updates, meeting confirmations, and weekly digest emails to parents.

**Multer**
Multer is Express middleware for handling `multipart/form-data` — which is the format used for file uploads. I used it for the bulk CSV import feature (admin uploads a student CSV file) and for the file upload middleware in general.

**csv-parser**
A Node.js library that reads CSV files row by row as a stream and converts each row into a JavaScript object. Used in `bulkImportParser.js` to parse the uploaded student CSV and create Student documents.

**node-cron**
A task scheduler for Node.js that runs functions on a cron schedule. I used it to schedule the weekly digest email — it runs every Sunday and sends each parent a summary of their child's attendance and grades for the week.

**axios (backend)**
Same Axios library, but used on the Node.js backend to make HTTP calls to the Python Flask AI service. When a teacher opens the Risk Monitor, the Node.js backend calls `POST http://localhost:8000/predict/risk` and returns the result to the frontend.

**morgan**
Morgan is an HTTP request logger middleware for Express. It logs every incoming request (method, URL, status code, response time) to the console during development. Useful for debugging API calls.

**dotenv**
Loads environment variables from a `.env` file into `process.env`. This keeps sensitive config (MongoDB URI, JWT secret, email credentials, Firebase key) out of the source code. Each service has a `.env.example` showing what variables are needed.

**cors**
CORS (Cross-Origin Resource Sharing) middleware for Express. Browsers block requests from one origin (React on port 3000) to another (Express on port 5000) by default. This middleware adds the right HTTP headers to allow cross-origin requests.

---

### AI SERVICE

**Python**
Python is the dominant language for data science and machine learning because of its rich ecosystem of libraries. I chose Python for the AI service specifically because scikit-learn, numpy, and pandas are far more mature and easier to use than any Node.js ML equivalent.

**Flask**
Flask is a lightweight Python web framework. It's minimal — just routing and request handling, nothing more. I used it to expose the ML models as HTTP endpoints (`/predict/risk`, `/predict/grade-trend`, etc.) so the Node.js backend can call them. Flask is perfect for small microservices like this.

**flask-cors**
Same concept as the Node.js `cors` package — allows the Flask service to accept requests from other origins (the Node.js backend).

**scikit-learn**
scikit-learn is Python's most popular machine learning library. It provides ready-to-use implementations of ML algorithms. I used three from it:
- `RandomForestClassifier` — for student risk prediction
- `LinearRegression` — for grade trend forecasting
- `IsolationForest` — for attendance anomaly detection
- `LabelEncoder` — to convert text labels (high/medium/low) to numbers for the model
- `cross_val_score` — to measure model accuracy with k-fold cross-validation

**numpy**
numpy is Python's numerical computing library. It provides fast array operations. I used it to generate synthetic training data (`np.random.uniform`), reshape arrays for model input, and compute rolling window statistics for anomaly detection.

**pandas**
pandas is Python's data manipulation library. It provides DataFrames — like spreadsheets in code. I used it to read and validate the CSV file when the admin uploads real training data to retrain the risk model.

**joblib**
joblib is used to serialize (save) and deserialize (load) Python objects to disk. I used it to save the trained Random Forest model as `risk_model.pkl` so it doesn't need to be retrained every time the Flask server restarts. `joblib.dump()` saves it, `joblib.load()` loads it.

---

### INFRASTRUCTURE & TOOLS

**Docker + Docker Compose**
Docker packages an application and all its dependencies into a container — an isolated environment that runs the same way on any machine. Docker Compose lets you define and run multiple containers together. I have Dockerfiles for all three services and a `docker-compose.yml` at the root that starts the frontend, backend, and AI service together with one command: `docker-compose up`.

**Vercel**
Vercel is a cloud platform for deploying frontend applications. It integrates directly with GitHub — every push to main auto-deploys the React app. It handles CDN, HTTPS, and custom domains automatically. Free tier is sufficient for a demo project.

**Railway / Render**
Cloud platforms for deploying Node.js and Python backend services. Similar to Vercel but for server-side apps. They detect the runtime automatically, read environment variables from a dashboard, and provide a public URL. Free tier works for demo purposes.

**Brevo (SMTP)**
Brevo (formerly Sendinblue) is an email service provider. I used their free SMTP relay to send transactional emails (absence alerts, grade notifications, credentials emails). The free tier allows 300 emails/day which is enough for a school demo.

**Firebase Cloud Messaging (FCM)**
Google's free push notification service. Works on Android, iOS, and web browsers. The parent registers their device and gets an FCM token, which is stored in the database. The server uses this token to push notifications directly to that device.

---

## 15. COMMON INTERVIEW QUESTIONS & ANSWERS

---

**Q: Why did you choose MongoDB over a relational database?**

A: The student profile has 50+ fields, many of which are optional — things like medical conditions, transport details, guardian info. In SQL, these would all be nullable columns or separate tables with joins. MongoDB's document model handles sparse data naturally. Also, the schema evolved a lot during development, and MongoDB let me add fields without migrations. The trade-off is no enforced foreign keys — I handle referential integrity in application code.

---

**Q: How does your JWT authentication work?**

A: On login, the server verifies the bcrypt password hash, then signs a JWT with the user's `_id` and the `JWT_SECRET` from environment variables. The client stores this token and sends it as `Authorization: Bearer <token>` on every request. The `protect` middleware decodes the token, fetches the user from MongoDB, and attaches it to `req.user`. The `authorize` middleware then checks if `req.user.role` is in the allowed roles for that route.

---

**Q: How does real-time chat work?**

A: I use Socket.io alongside Express on the same server. When a parent or teacher opens a chat, the frontend joins a Socket.io room with a unique `roomId` (based on teacher and parent IDs). When a message is sent, it goes through a REST API call first — this saves it to MongoDB. Then the controller emits a `newMessage` event to the room via `req.app.get('io').to(roomId).emit(...)`. This way messages are persisted even if the other user is offline.

---

**Q: Explain your AI risk prediction model.**

A: I use a Random Forest classifier with three features: attendance percentage, average grade percentage, and homework completion rate. The label is computed as a weighted score — attendance and grades each contribute 40%, homework 20%. Students scoring below 45 are high risk, 45–70 medium, above 70 low. The model is trained on 500 synthetic data points by default, but the admin can upload a real CSV to retrain it. I use 5-fold cross-validation to measure accuracy. If the Flask service is unreachable, the Node.js backend falls back to computing the same weighted formula directly.

---

**Q: Why a separate Python service for AI instead of a Node.js ML library?**

A: Python's scikit-learn ecosystem is far more mature than anything available in Node.js for ML. Libraries like numpy, pandas, and joblib make it easy to train, serialize, and load models. The separation also means I can update the AI models without touching the main backend, and in production they could be scaled independently.

---

**Q: How do you prevent duplicate attendance records?**

A: Two layers. First, the Attendance schema has a compound unique index on `{ student: 1, date: 1 }` — MongoDB will reject a duplicate at the database level. Second, the `markAttendance` controller uses `findOneAndUpdate` with `upsert: true`, so if a teacher re-marks attendance for the same student on the same day, it updates the existing record instead of creating a new one.

---

**Q: How does the notification system work?**

A: When a student is marked absent or a grade is uploaded, the backend does three things: creates a Notification document in MongoDB (for in-app display), sends a Firebase Cloud Messaging push notification to the parent's device using their stored `fcmToken`, and sends an HTML email via Brevo SMTP using Nodemailer. The notification is wrapped in try/catch so a failed push or email never blocks the main operation (attendance marking or grade saving).

---

**Q: What is the Engagement Score and how is it calculated?**

A: It's a 0–100 score measuring how actively a parent is involved with their child's education over the last 30 days. It's a weighted sum: login frequency (25 pts), chat responsiveness (25 pts), meetings attended (20 pts), homework acknowledgements (15 pts), and notification open rate (15 pts). Each component is capped to prevent outliers from dominating. The score produces a level — Highly Engaged, Moderately Engaged, or Low Engagement — and specific insights like "No meetings attended — schedule a parent-teacher meeting."

---

**Q: What are the known limitations of your project?**

A: A few honest ones:
1. The AI model is trained on synthetic data — accuracy on real school data would need validation
2. File upload for homework assignments works for students submitting work, but teachers cannot attach files when creating homework assignments yet
3. No mobile app — the React frontend is responsive but a native app would be better

---

**Q: How would you scale this system for a large school with 5000 students?**

A: Several changes:
- Add Redis for caching frequently accessed data (student lists, attendance summaries)
- Move notification sending to a message queue (AWS SQS or Bull) so it's async and doesn't block API responses
- Add database indexes on commonly queried fields (student class/section, attendance date ranges)
- Horizontally scale the Node.js backend behind a load balancer
- The AI service is already separate, so it can be scaled independently
- Use MongoDB Atlas auto-scaling for the database tier

---

**Q: Walk me through what happens when a teacher marks a student absent.**

A: 
1. Teacher selects students and clicks "Mark Absent" on the Attendance page
2. Frontend sends `POST /api/attendance` with `{ records: [{studentId, status: 'absent'}], date }`
3. `protect` middleware verifies JWT, `authorize('teacher','admin')` checks role
4. `markAttendance` controller runs `findOneAndUpdate` with upsert — creates or updates the record
5. Checks if `status === 'absent'` and `notificationSent === false`
6. Fetches the student document, which has a `parent` reference to a User
7. Creates a Notification document in MongoDB
8. Calls `sendPush` with the parent's `fcmToken` — Firebase delivers push to parent's phone
9. Calls `sendEmail` with the parent's email — Brevo SMTP sends HTML email
10. Sets `notificationSent = true` and saves — prevents duplicate alerts if teacher re-marks
11. Returns the attendance records to the frontend

---

**Q: How does the bulk CSV import work?**

A: Admin uploads a CSV file through the BulkImport page. The backend uses `multer` for file upload handling. `bulkImportParser.js` reads the CSV, validates required fields, and creates Student documents. For students without a real email, it generates a placeholder `rollNumber@scope.internal` address. The admin can then run "Provision Student Users" which creates User accounts for all students, and later send credentials emails to those with real email addresses.

---

**Q: What design patterns did you use?**

A: 
- **MVC** — Models (Mongoose schemas), Controllers (business logic), Routes (URL mapping)
- **Middleware pattern** — `protect` and `authorize` as composable Express middleware
- **Repository pattern** — loosely, each controller handles its own data access
- **Observer pattern** — Socket.io events for real-time updates
- **Microservices** — separate AI service with well-defined HTTP API contract
- **Fallback/Circuit breaker** — AI controller falls back to rule-based logic if Flask is down

---

## 16. TECHNICAL KEYWORDS TO MENTION

When answering, naturally use these terms to show depth:

- **Backend:** Express middleware chain, JWT Bearer tokens, bcrypt salt rounds, Mongoose virtuals, compound indexes, upsert, populate (MongoDB joins), async/await, try/catch error boundaries
- **Frontend:** React Context API, protected routes, Axios interceptors, Socket.io client, Chart.js, Tailwind utility classes, role-based rendering
- **AI/ML:** Random Forest, cross-validation, joblib serialization, Linear Regression slope, Isolation Forest contamination parameter, feature engineering, synthetic training data
- **Infrastructure:** Docker Compose, environment variables, CORS, health check endpoints, cron jobs, webhook-style event triggers

---

## 17. PROJECT METRICS TO QUOTE

- **11 modules** built end-to-end
- **4 user roles** with separate dashboards
- **3 AI models** (Random Forest, Linear Regression, Isolation Forest)
- **50+ fields** in the Student schema
- **Dual notification channels** (push + email) on every alert
- **500 synthetic training samples** for the risk model
- **3 microservices** communicating over HTTP

---

*Good luck with your interviews, Sneha! You built something genuinely impressive — own it confidently.*
