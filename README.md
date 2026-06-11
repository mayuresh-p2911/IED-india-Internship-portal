# IED India Internship Management System

A full-stack Internship Management Portal built with **Node.js + Express + MongoDB + Vanilla JS**.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### 1. Configure Environment

Open `server/.env` and **replace the MongoDB URI**:

```env
MONGODB_URI=mongodb+srv://<your-username>:<your-password>@<your-cluster>.mongodb.net/ied-ims?retryWrites=true&w=majority
```

### 2. Install Dependencies

```bash
cd server
npm install
```

### 3. Seed Demo Data

```bash
cd server
npm run seed
```

This creates demo accounts and sample data.

### 4. Start Server

```bash
cd server
npm start
```

> For development with auto-reload:
> ```bash
> npm run dev
> ```

### 5. Open in Browser

Visit: **http://localhost:5000**

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 👑 Super Admin | admin@ied.com | Admin@123 |
| 👩‍💼 HR Manager | hr@ied.com | Hr@123 |
| 👨‍🏫 Mentor | mentor@ied.com | Mentor@123 |
| 🎓 Intern | intern@ied.com | Intern@123 |

---

## 📁 Project Structure

```
IED INDIA INTERNSHIP PORTAL/
├── server/                 # Node.js Backend
│   ├── server.js          # Entry point (port 5000)
│   ├── .env               # ⚠️ Update MONGODB_URI here
│   ├── config/db.js       # MongoDB connection
│   ├── models/            # 11 Mongoose schemas
│   ├── controllers/       # Business logic
│   ├── routes/            # Express API routes
│   ├── middleware/        # JWT auth + role guard
│   ├── services/          # Email, PDF, QR services
│   └── utils/seed.js      # Database seeder
└── client/                # Frontend SPA
    ├── index.html         # Single page app
    ├── css/               # Design system
    └── js/                # App logic + modules
```

---

## 🧩 Modules

| Module | Admin | HR | Mentor | Intern |
|--------|-------|----|--------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| User Management | ✅ | 👁 | ❌ | ❌ |
| Applications | ✅ | ✅ | 👁 | ✅ Apply |
| Interviews | ✅ | ✅ | 👁 | 👁 |
| Onboarding | ✅ | ✅ | 👁 | ✅ Upload |
| Attendance | ✅ | ✅ | 👁 | ✅ Mark |
| Tasks | ✅ | ✅ | ✅ Assign | ✅ Submit |
| Communication | ✅ | ✅ | ✅ | ✅ |
| Evaluations | ✅ | 👁 | ✅ | 👁 |
| Certificates | ✅ | ✅ | 👁 | ✅ Download |
| Analytics | ✅ | ✅ | ❌ | ❌ |
| Leave Mgmt | ✅ | ✅ | ✅ | ✅ Apply |

---

## ⚙️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/users | List users |
| POST | /api/applications | Submit application (public) |
| PATCH | /api/applications/:id/status | Update status |
| POST | /api/attendance/mark | Mark attendance (with geo) |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/:id/submit | Submit task |
| POST | /api/evaluations | Submit evaluation |
| POST | /api/certificates/generate | Generate PDF certificate |
| GET | /api/analytics/summary | Dashboard stats |

---

## 🔧 Email Configuration (Optional)

To enable real email notifications, add Gmail SMTP credentials to `.env`:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password   # Gmail App Password (not your account password)
```

Without email config, the system runs in **mock mode** (logs emails to console).

---

## 🔒 Security

- JWT authentication on all protected routes
- bcrypt password hashing
- Role-based access control middleware
- Helmet.js security headers
- File upload size limits (5MB for docs, 10MB for onboarding)

---

## 📦 Tech Stack

**Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, Multer, PDFKit, Nodemailer, QRCode

**Frontend**: HTML5, Vanilla CSS (Glassmorphism), Vanilla JavaScript, Chart.js, Lucide Icons

---

*Built for IED India Pvt Ltd — Empowering Future Leaders Through Excellence*
