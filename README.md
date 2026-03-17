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
- **AI/ML** - Python Flask service using scikit-learn
- **Notifications** - Firebase Cloud Messaging for push, Nodemailer + Brevo SMTP for emails
- **Auth** - JWT tokens with bcrypt password hashing

---

## Project structure

```
smart-parent-engagement/
  scope-frontend/      React app (port 3000)
  scope-backend/       Node/Express API (port 5000)
  scope-ai-service/    Python Flask AI (port 8000)
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

**AI service**
```
cd scope-ai-service
pip install -r requirements.txt
python app.py
```

---

## Environment variables

Each service has a `.env.example` file showing what variables are needed. Main ones are:

- `MONGO_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - any random secret string
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` - SMTP credentials (I used Brevo)
- `AI_SERVICE_URL` - URL of the Flask service, default http://localhost:8000
- `FIREBASE_SERVER_KEY` - for push notifications

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
| GET | /ai/risk/:studentId | Get AI risk prediction |
| GET | /ai/grade-trend/:studentId | Get grade trend forecast |
| GET | /ai/attendance-anomaly/:studentId | Check attendance anomaly |

---

## AI features

The AI service runs separately on port 8000. It has three main things:

1. **Risk prediction** - uses a Random Forest model trained on attendance, grades and homework completion to predict if a student is at high/medium/low risk

2. **Grade trend forecasting** - uses Linear Regression on past exam scores to predict the next score and show if a student is improving or declining per subject

3. **Attendance anomaly detection** - uses Isolation Forest to detect unusual patterns like sudden drops or frequent Monday/Friday absences

4. **Learning recommendations** - rule based system that suggests study resources for weak subjects

---

## Modules built

1. Student management
2. Attendance tracking with parent alerts
3. Grade management with notifications
4. Homework tracker
5. Push and email notifications
6. Parent-teacher chat (real-time with Socket.io)
7. Meeting request system
8. AI risk monitor for teachers
9. Parent engagement scoring
10. Admin analytics dashboard
11. Bulk student import via CSV

---

## Known issues / things to improve

- The AI model is trained on synthetic data right now, ideally it should be retrained on real school data
- No mobile app yet, the React frontend is responsive but a native app would be better
- File upload for assignments is not done yet
- Multilingual support is partially done (i18n setup exists but translations are incomplete)

---

## Deployment

- Backend and AI service can be deployed on Railway or Render (free tier works fine for demo)
- Frontend goes on Vercel
- Database is already on MongoDB Atlas cloud

---

*Built by Sneha Hudge as part of final year engineering project.*
