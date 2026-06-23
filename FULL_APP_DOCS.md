# 📋 Full Project and Task Management System Documentation

## 1. 🏗️ Overview

The application is a full-stack project and task management system designed to coordinate teams, track projects, tasks, and work logs. It supports Role-Based Access Control (RBAC) with distinct privileges for administrators, managers, and members (employees).

The application has real-time notifications via Socket.io and SSE, comprehensive reporting, and audit logging features.

---

## 2. 🎨 Tech Stack

| Layer      | Technology                            |
| ---------- | ------------------------------------- |
| **Frontend** | React 18, Tailwind CSS 3, Recoil (State Management), React Router DOM v6 |
| **Backend**  | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Auth**     | JWT (jsonwebtoken), bcryptjs |
| **Real-time**| Socket.io, SSE (Server-Sent Events) |
| **Others**   | Multer (uploads), Nodemailer (emails), HTML2Canvas & jsPDF (reporting exports) |

---

## 3. 🚀 Setup & Execution

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas cluster)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env    # Fill in MONGO_URI, JWT_SECRET, PORT (default 5000), SMTP configs, etc.
npm run dev             # Starts the API on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm start               # Starts the Vite preview or dev server on http://localhost:5173
```

---

## 4. 📁 Project Structure

### Backend

```text
backend/src/
├── config/              # MongoDB connection (db.js), Mailer, Scheduler
├── controllers/         # Request handling logic for Auth, Users, Projects, Tasks, Reports, Notifications, Worklogs
├── middleware/          # Auth protections (JWT validation, roles), Validation
├── models/              # Mongoose schemas (User, Project, Task, WorkLog, Notification, AuditLog)
├── routes/              # Express API route declarations
├── utils/               # Socket.js setup, AuditLogger, NotificationEvents
└── server.js            # Express app entry point & HTTP/Socket server wrapper
```

### Frontend

```text
frontend/src/
├── api/                 # Axios instance interceptors + separate API callers (auth, project, task, etc.)
├── assets/              # Static assets (images, svgs)
├── components/          # Reusable UI components
│   ├── common/          # Modals, Inputs, Buttons, Badges, Spinners
│   ├── layout/          # Top Navbar, Sidebar wrappers
│   ├── project/         # ProjectCards, Forms
│   └── task/            # TaskCards, Forms, Kanban Board view
├── context/             # ThemeContext, SocketContext
├── hooks/               # Custom hooks wrapper for Recoil actions/API calls (useAuth, useTasks, useProjects)
├── pages/               # Top-level Page Views (Auth, Dashboard, Projects, Tasks, Notifications, Reports, Users)
├── recoil/              # State management
│   ├── atoms/           # Auth, Projects, Tasks, Notifications states
│   └── selectors/       # Derived state filtering
├── routes/              # React Router definitions (AppRoutes, PrivateRoute)
├── utils/               # Constants, formatting helpers (formatDate, getInitials)
├── App.jsx              # RecoilRoot, ThemeProvider, BrowserRouter wrappers
└── index.css            # Tailwind base config
```

---

## 5. 🗄️ Database Models

1. **User (`user.model.js`)**: Tracks user details, roles (`admin`, `manager`, `member`), authentication (password hashing, reset tokens).
2. **Project (`project.model.js`)**: Contains details about projects, status, priority, owner, assigned manager, members (with specific roles), and timelines.
3. **Task (`task.model.js`)**: Contains task details, statuses (`todo`, `in-progress`, `in-review`, `completed`, `blocked`), priority, project relations, assigned user, tracked comments (with attachments), and task history.
4. **WorkLog (`worklog.model.js`)**: Tracks actual hours worked by employees on specific tasks, including descriptions, timestamps, attachments, and replies.
5. **Notification (`notification.model.js`)**: Stores system/user alerts (e.g., "Task Assigned", "Project Created") and read/unread status.
6. **AuditLog (`auditlog.model.js`)**: Keeps a persistent record of critical system events for compliance and history.

---

## 6. 🔌 API Endpoints Summary

### Auth (`/api/auth`)
- `POST /register`: Register user
- `POST /login`: Authenticate and receive JWT
- `GET /me`: Get authenticated user profile
- `POST /logout`: Logout user

### Users (`/api/users`)
- CRUD operations for users. Typically restricted by role (Admin for listing all).

### Projects (`/api/projects`)
- `GET /`: List projects (filtered by user's role and assignments)
- `POST /`: Create project
- `GET /:id`: Get specific project details
- `PUT /:id`: Update project info
- `DELETE /:id`: Remove project
- `POST /:id/members`: Add a user as a member
- `DELETE /:id/members/:uid`: Remove a member

### Tasks (`/api/tasks`)
- `GET /`: List tasks (supports filtering by project, status, priority, assignments)
- `POST /`: Create new task
- `GET /:id`: Get task by ID
- `PUT /:id`: Update task (including status changes for Kanban board drag & drop)
- `DELETE /:id`: Delete a task
- `POST /:id/comments`: Add a comment with optional attachment to a task

### Work Logs (`/api/worklogs`)
- `GET /`: List work logs (filtered by task or employee)
- `POST /`: Log hours against a task
- `GET /:id`: Get specific work log details
- `PUT /:id` / `DELETE /:id`: Update/delete log
- `POST /:id/replies`: Add discussion threads on a work log

### Reports (`/api/reports`)
- `GET /dashboard`: Aggregate statistics for dashboard widgets
- `GET /projects/:id`: Generate specific project progress report
- `GET /employees`: Employee utilization and performance metrics
- `GET /audit-logs`: System audit trail

### Notifications (`/api/notifications`)
- `GET /`: Get user's notifications
- `GET /stream`: Server-Sent Events (SSE) stream for real-time notification updates
- `PUT /read-all`: Mark all as read
- `PUT /:id/read`: Mark single notification as read

---

## 7. 🔐 Security & Access Control

1. **Authentication:**
   - JWT-based authentication.
   - Passwords are encrypted using `bcryptjs`.
2. **Role-Based Access Control (RBAC):**
   - **Admin:** Has global access. Can view/edit all projects, manage all users, system-wide reports.
   - **Manager:** Can manage assigned projects, assign tasks to members in those projects, view project-level reports.
   - **Member/Employee:** Can view assigned tasks, update task status (e.g. `todo` to `in-progress`), add work logs, and comment. Cannot delete or heavily modify parent projects.

---

## 8. 🌐 Real-time Features

- **Socket.io:** Initialized in `backend/src/utils/socket.js`, handles fast bi-directional events like Kanban board updates or instant task messaging.
- **Server-Sent Events (SSE):** Implemented in `backend/src/controllers/notification.controller.js` to stream real-time push notifications (e.g. task assignment alerts) to the logged-in client.

---

## 9. 🎨 Frontend Core Interactions

- **State Management:** Uses **Recoil** for complex global states like `projectAtom`, `taskAtom` allowing Kanban boards to efficiently sync without deep prop drilling.
- **Routing:** Protected routing using `<PrivateRoute>` which checks the Recoil `authAtom` state before allowing dashboard access.
- **Kanban Board (`KanbanBoard.jsx`):** Groups tasks by status. Usually supports drag-and-drop to rapidly call `PUT /api/tasks/:id` updating the task's status field.
- **Report Exports:** The system utilizes `html2pdf.js`, `jspdf`, and `react-to-print` to allow users to generate downloadable PDF reports from dashboard statistics and project details.
