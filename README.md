# SCOPE - Smart Continuous Parent Engagement System

This is my final year project. The idea is to build a platform that helps schools stay connected with parents and improve student performance through regular communication and monitoring.

---

## What this project does

Most schools still rely on physical diaries or WhatsApp groups to communicate with parents. SCOPE replaces that with a proper system where:
- Teachers can mark attendance and upload grades
- Parents get instant notifications when their child is absent or scores low
- There's a built-in chat between teachers and parents
- The system predicts which students are at risk academically
- Parents can request meetings with teachers

---

## Tech stack I used

- **Frontend** - React.js with Tailwind CSS and Chart.js for graphs
- **Backend** - Node.js with Express
- **Database** - MongoDB Atlas (free tier)
- **Notifications** - Firebase Cloud Messaging for push, Nodemailer + Brevo SMTP for emails
- **Auth** - JWT tokens with bcrypt password hashing

---

## Project structure

```
smart-parent-engagement/
  scope-frontend/      React app (port 3000)
  scope-backend/       Node/Express API (port 5000)
```

---

## User roles

| Role | What they can do |
|------|-----------------|
| Admin | Manage all users, view analytics, bulk import students |
| Teacher | Mark attendance, upload grades, post homework, chat with parents |
| Parent | View child's grades and attendance, chat with teacher, request meetings |
| Student | View own grades, homework, attendance |

---

## How to run locally

You need Node.js 18+, Python 3.9+, and a MongoDB Atlas connection string.

**Backend**
```
cd scope-backend
npm install
cp .env.example .env
# fill in your MongoDB URI, JWT secret, email credentials
npm run dev
```

**Frontend**
```
cd scope-frontend
npm install
npm start
```

---

## Environment variables

Each service has a `.env.example` file showing what variables are needed. Main ones are:

- `MONGO_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - any random secret string
- `JWT_REFRESH_SECRET` - different random secret for refresh tokens
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` - SMTP credentials (I used Brevo)
- `FIREBASE_SERVER_KEY` - for push notifications
- `ALLOWED_ORIGIN` - frontend URL for CORS
- `FRONTEND_URL` - frontend URL for password reset emails

---

## API endpoints

Base URL is `http://localhost:5000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| GET | /students | Get all students |
| POST | /attendance | Mark attendance |
| GET | /attendance/:studentId | Get student attendance |
| POST | /grades | Add grade |
| GET | /grades/:studentId | Get student grades |
| POST | /homework | Create homework |
| GET | /homework/:classId | Get homework for a class |
| POST | /notifications/send | Send notification |
| GET | /chat/:roomId | Get chat messages |
| POST | /chat/send | Send message |

---

## Modules built

1. Student management
2. Attendance tracking with parent alerts
3. Grade management with notifications
4. Homework tracker
5. Push and email notifications
6. Parent-teacher chat (real-time with Socket.io)
7. Meeting request system
8. Admin analytics dashboard
9. Bulk student import via CSV
10. Secure password reset with email tokens
11. JWT token refresh mechanism

---

## Known issues / things to improve

- No mobile app yet, the React frontend is responsive but a native app would be better
- File upload for teacher homework attachments is not done yet (students can upload)
- Multilingual support is partially done (i18n setup exists but translations are incomplete)

---

## Deployment

- Backend can be deployed on Railway or Render (free tier works fine for demo)
- Frontend goes on Vercel
- Database is already on MongoDB Atlas cloud

---

*Built by Sneha Hudge as part of final year engineering project.*
