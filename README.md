# SCOPE – Smart Continuous Parent Engagement System

A scalable, production-ready platform to improve student academic performance through parental involvement, AI insights, and real-time school-parent communication.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        SCOPE Platform                        │
├──────────────┬──────────────────────┬───────────────────────┤
│  React.js    │   Node.js + Express  │   Python Flask (AI)   │
│  Frontend    │   REST API Backend   │   Risk Prediction      │
│  Port: 3000  │   Port: 5000         │   Port: 8000           │
├──────────────┴──────────────────────┴───────────────────────┤
│                    MongoDB Atlas (Cloud DB)                   │
├─────────────────────────────────────────────────────────────┤
│         Firebase Cloud Messaging  │  Nodemailer (Email)      │
└─────────────────────────────────────────────────────────────┘
```

## User Roles
| Role    | Access                                              |
|---------|-----------------------------------------------------|
| Admin   | Full system control, analytics, user management     |
| Teacher | Attendance, grades, homework, chat with parents     |
| Parent  | View child's data, chat with teacher, notifications |
| Student | View own grades, homework, submit assignments       |

## Modules
1. Student Management
2. Real-Time Attendance Monitoring
3. Academic Performance Tracking
4. Homework & Assignment Tracking
5. Smart Notification System (Push/SMS/Email)
6. Parent-Teacher Communication Hub
7. AI-Based Student Risk Prediction
8. AI Learning Recommendation System
9. Parent Engagement Score
10. Analytics Dashboard
11. Multilingual Support (EN/HI/MR)
12. Emotion / Feedback System

## Tech Stack
- **Frontend**: React.js, Chart.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **AI Service**: Python, Flask, Scikit-learn
- **Notifications**: Firebase Cloud Messaging, Nodemailer
- **Auth**: JWT + bcrypt

## Quick Start

### Prerequisites
- Node.js >= 18
- Python >= 3.9
- MongoDB Atlas account
- Firebase project

### Backend
```bash
cd scope-backend
npm install
cp .env.example .env   # fill in your values
npm run dev
```

### Frontend
```bash
cd scope-frontend
npm install
npm start
```

### AI Service
```bash
cd scope-ai-service
pip install -r requirements.txt
python app.py
```

## Environment Variables
See `.env.example` in each service directory.

## API Documentation
Base URL: `http://localhost:5000/api`

| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| POST   | /auth/register                  | Register user                |
| POST   | /auth/login                     | Login                        |
| GET    | /students                       | List students                |
| POST   | /attendance                     | Mark attendance              |
| GET    | /attendance/:studentId          | Get attendance history       |
| POST   | /grades                         | Upload grades                |
| GET    | /grades/:studentId              | Get student grades           |
| POST   | /homework                       | Create homework              |
| GET    | /homework/:classId              | Get class homework           |
| POST   | /notifications/send             | Send notification            |
| GET    | /chat/:roomId                   | Get chat messages            |
| POST   | /chat/send                      | Send message                 |
| GET    | /analytics/dashboard            | Dashboard analytics          |
| POST   | /feedback                       | Submit feedback              |
| GET    | /engagement/:parentId           | Parent engagement score      |

AI Service: `http://localhost:8000`

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| POST   | /predict/risk         | Predict student risk level   |
| POST   | /recommend/learning   | Get learning recommendations |
| POST   | /train                | Retrain model                |

## Deployment
- Backend + AI: AWS EC2 / Railway / Render
- Frontend: Vercel / Netlify
- Database: MongoDB Atlas (M0 free tier to start)
- File Storage: AWS S3 / Cloudinary
