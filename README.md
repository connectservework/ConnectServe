# ConnectServe 🌍 — Social Media & Community Service Management System

**ConnectServe** is a modern, full-stack web platform bridging community volunteers, non-profit organizations (NGOs), and platform administrators. It unifies social media networking (profiles, news feed, likes, comments, shares, 1:1 direct chat, real-time notifications) with volunteering operations (event publishing, application approval workflows, digital attendance marking, automatic volunteer hour tracking, achievement badges, and verifiable PDF certificates).

---

## 🚀 Key Features

### 1. 👥 Multi-Role User Architecture
- **Volunteers / Users**: Discover volunteering opportunities, apply to events, log verified service hours, unlock milestone badges (Bronze, Silver, Gold, Platinum), download digital certificates, publish stories, like/comment, and message organizers.
- **Organizations / NGOs**: Host community service projects, manage applicant rosters, approve/reject applications with automated email notifications, mark attendance, and auto-issue digital certificates.
- **System Administrator**: Platform-wide analytics (interactive charts with Recharts), user account governance, NGO verification badge management, and content moderation queue for reported posts.

### 2. 📱 Social Networking Module
- **Personalized Feed**: Stream of updates from followed users and NGOs with responsive media, hashtags, and tagged events.
- **Interactive Posts**: Rich-text and media captions, optimistic like updates, expandable comment threads, and multi-platform share modals.
- **Live 1:1 Messaging**: Real-time direct chat powered by Socket.IO with typing indicators and file attachments.
- **Instant In-App Alerts**: Live notification bell with unread badge counter and real-time popups.

### 3. 🌱 Community Service Management Module
- **Event Discovery**: Multi-filter by cause categories (*Environment, Education, Health, Food Security, Crisis Relief*), location format (*In-person, Virtual, Hybrid*), date, and keywords.
- **Volunteer Workflow**: One-click application submission with organizer notes.
- **Digital Roster & Attendance**: One-click attendance verification that immediately logs hours to volunteer profiles and updates impact leaderboards.
- **Digital Certificates**: Tamper-proof digital certificates featuring unique verification codes and instant one-click high-resolution PDF download using `jsPDF` and `html2canvas`.
- **Public Certificate Verification**: Public lookup portal (`/verify/:code`) to validate certificate authenticity.
- **Gamification & Leaderboard**: Automatic milestone badge evaluation and real-time ranking of top volunteers with a podium showcase.

### 4. ☁️ Cloudinary Media Storage (Mandatory Section 6)
- File uploads (avatars, banners, post images, chat attachments) stream directly into Cloudinary folders (`connectserve/profiles`, `connectserve/posts`, `connectserve/events`, `connectserve/chat`).
- On-the-fly transformations (`w_auto,c_fill,q_auto,f_auto`) deliver device-optimized responsive assets.
- Asset deletion hooks remove replaced/deleted files from Cloudinary using `public_id`.

### 5. 📱 Fully Responsive & Mobile-First
- Designed for mobile phones (≥320px), tablets (≥768px), laptops (≥1024px), and large screens (≥1440px).
- Bottom navigation bar on mobile + collapsible drawer; full sidebar navigation on desktop.
- Touch targets exceed 44x44px.
- Dark and Light mode theme toggle with persistent storage.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 (Vite), React Router v6, Tailwind CSS, Lucide Icons, Socket.IO Client, Axios, React Hot Toast, Recharts, jsPDF, html2canvas
- **Backend**: Node.js, Express.js (REST API, MVC Architecture), Socket.IO
- **Database**: MongoDB with Mongoose ODM (with automatic in-memory fallback for zero-configuration local runs)
- **Security & Validation**: JWT, bcryptjs, Helmet, CORS, Morgan, express-validator
- **Media & Emails**: Multer (Memory Storage) + Cloudinary SDK, Nodemailer

---

## 📂 Project Structure

```
connectserve/
├── client/                                  # React (Vite) Frontend
│   ├── src/
│   │   ├── components/                      # UI components (layout, posts, events, certificates, chat, admin)
│   │   ├── pages/                           # 17 route-level pages (Feed, Events, Profile, Admin, etc.)
│   │   ├── context/                         # AuthContext, ThemeContext, SocketContext
│   │   ├── hooks/                           # Custom React hooks
│   │   ├── services/                        # Axios API service modules
│   │   ├── utils/                           # Constants, date formatters, badge logic
│   │   ├── App.jsx                          # Main routing & layout controller
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                                  # Express Backend
│   ├── config/                              # db.js, cloudinary.js
│   ├── models/                              # 11 Mongoose Schemas (User, Post, Event, Certificate, etc.)
│   ├── controllers/                         # 9 MVC Controllers
│   ├── routes/                              # 9 RESTful Route Handlers
│   ├── middleware/                          # JWT Auth, Role RBAC, Upload, Error handling
│   ├── utils/                               # seedData.js, emailService.js, badgeCalculator.js
│   └── server.js                            # HTTP & Socket.IO server entry point
├── .env.example                             # Environment variable template
└── README.md
```

---

## ⚡ Quick Start & Setup Guide

### 1. Prerequisites
- Node.js (v18+ recommended, v24+ supported)
- npm (v9+)
- (Optional) MongoDB Atlas URI or local mongod. If omitted, the server automatically boots an in-memory MongoDB database!

### 2. Configure Environment Variables
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```

Configure your credentials in `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/connectserve
JWT_SECRET=connectserve_production_super_secret_jwt_key_2026_x89!
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Install Dependencies
```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

### 4. Seed Demo Data (Optional / Automated)
If the database is empty, the server automatically populates demo data on boot!
To manually seed:
```bash
cd server
npm run seed
```

### 5. Run the Application
In terminal 1 (Backend Server):
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

In terminal 2 (Frontend Client):
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email | Password | Features / Access |
| :--- | :--- | :--- | :--- |
| **Volunteer (Alex Morgan)** | `alex@volunteer.org` | `password123` | 36 hrs, Gold badge, earned certificates |
| **Volunteer (Sarah Chen)** | `sarah@volunteer.org` | `password123` | 54 hrs, Food Champion, active applications |
| **NGO (Green Earth Initiative)** | `contact@greenearth.ngo` | `password123` | Verified NGO, hosts tree planting drives |
| **NGO (City Food Bank)** | `hello@foodbank.ngo` | `password123` | Verified NGO, manages pantry drives |
| **Platform Administrator** | `admin@connectserve.org` | `password123` | Full admin analytics, moderation, NGO verify |

*(Note: The Login screen includes one-click demo login buttons for instant role switching without typing).*

---

## 📡 REST API Summary

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/refresh-token`
- **Users**: `GET /api/users/:idOrUsername`, `PUT /api/users/profile`, `POST /api/users/:id/follow`, `GET /api/users/leaderboard`
- **Posts**: `GET /api/posts/feed`, `GET /api/posts/explore`, `POST /api/posts`, `POST /api/posts/:id/like`, `POST /api/posts/:id/comments`, `DELETE /api/posts/:id`
- **Events**: `GET /api/events`, `POST /api/events`, `GET /api/events/:id`, `PUT /api/events/:id`, `DELETE /api/events/:id`, `POST /api/events/:id/reviews`
- **Applications & Attendance**: `POST /api/events/:id/register`, `GET /api/registrations/my`, `GET /api/events/:id/applicants`, `PUT /api/registrations/:id/status`, `POST /api/registrations/:id/attendance`
- **Certificates**: `GET /api/certificates/my`, `GET /api/certificates/verify/:code`, `GET /api/certificates/:id`
- **Direct Chat**: `GET /api/chat/conversations`, `POST /api/chat/conversations`, `GET /api/chat/conversations/:id/messages`, `POST /api/chat/conversations/:id/messages`
- **Notifications**: `GET /api/notifications`, `PUT /api/notifications/read-all`, `PUT /api/notifications/:id/read`
- **Admin**: `GET /api/admin/analytics`, `GET /api/admin/users`, `PUT /api/admin/users/:id`, `GET /api/admin/organizations`, `PUT /api/admin/organizations/:id/verify`, `GET /api/admin/reports`, `PUT /api/admin/reports/:id`
