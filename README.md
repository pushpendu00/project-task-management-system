# 📋 Project Task Management System

A full-stack project and task management application built with React, Recoil, Tailwind CSS, Node.js, Express, and MongoDB.

---

## 🏗️ Project Structure

```
project-task-management-system/
├── frontend/          ← React 18 + Tailwind CSS + Recoil
└── backend/           ← Node.js + Express + MongoDB REST API
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env    # Edit with your MongoDB URI and JWT secret
npm run dev             # Starts on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm start               # Starts on http://localhost:5173
```

---

## 📁 Frontend Structure

```
frontend/src/
├── api/                 ← Axios instance + API call functions
│   ├── axios.js         ← Base axios config with interceptors
│   ├── auth.api.js
│   ├── project.api.js
│   └── task.api.js
├── components/
│   ├── common/          ← Reusable UI (Button, Input, Modal, Badge, Spinner)
│   ├── layout/          ← Sidebar, Layout wrapper
│   ├── project/         ← ProjectCard, ProjectForm
│   └── task/            ← TaskCard, TaskForm, KanbanBoard
├── hooks/               ← Custom hooks (useAuth, useProjects, useTasks)
├── pages/
│   ├── auth/            ← LoginPage, RegisterPage
│   ├── dashboard/       ← DashboardPage
│   ├── projects/        ← ProjectsPage, ProjectDetailPage
│   └── tasks/           ← TasksPage
├── recoil/
│   ├── atoms/           ← authAtom, projectAtom, taskAtom
│   └── selectors/       ← authSelectors, taskSelectors
├── routes/              ← AppRoutes, PrivateRoute
├── utils/               ← formatDate.js, constants.js
├── App.js               ← RecoilRoot + BrowserRouter
└── index.css            ← Tailwind directives + design system
```

---

## 📁 Backend Structure

```
backend/src/
├── config/
│   └── db.js            ← MongoDB connection
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── project.controller.js
│   └── task.controller.js
├── middleware/
│   ├── auth.middleware.js    ← JWT protect + role authorize
│   └── validate.middleware.js
├── models/
│   ├── user.model.js
│   ├── project.model.js
│   └── task.model.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── project.routes.js
│   └── task.routes.js
└── server.js            ← Express entry point
```

---

## 🔌 API Endpoints

### Auth

| Method | Route              | Description      |
| ------ | ------------------ | ---------------- |
| POST   | /api/auth/register | Register user    |
| POST   | /api/auth/login    | Login user       |
| GET    | /api/auth/me       | Get current user |
| POST   | /api/auth/logout   | Logout           |

### Projects

| Method | Route                          | Description       |
| ------ | ------------------------------ | ----------------- |
| GET    | /api/projects                  | List all projects |
| POST   | /api/projects                  | Create project    |
| GET    | /api/projects/:id              | Get project       |
| PUT    | /api/projects/:id              | Update project    |
| DELETE | /api/projects/:id              | Delete project    |
| POST   | /api/projects/:id/members      | Add member        |
| DELETE | /api/projects/:id/members/:uid | Remove member     |

### Tasks

| Method | Route                   | Description |
| ------ | ----------------------- | ----------- |
| GET    | /api/tasks              | List tasks  |
| POST   | /api/tasks              | Create task |
| GET    | /api/tasks/:id          | Get task    |
| PUT    | /api/tasks/:id          | Update task |
| DELETE | /api/tasks/:id          | Delete task |
| POST   | /api/tasks/:id/comments | Add comment |

---

## 🎨 Tech Stack

| Layer      | Technology                            |
| ---------- | ------------------------------------- |
| Frontend   | React 18, Tailwind CSS 3, Recoil      |
| Routing    | React Router DOM v6                   |
| HTTP       | Axios (with JWT interceptor)          |
| Backend    | Node.js, Express.js                   |
| Database   | MongoDB, Mongoose                     |
| Auth       | JWT (jsonwebtoken), bcryptjs          |
| Validation | express-validator                     |
| Dev        | nodemon, react-hot-toast, react-icons |
