# 🏗️ Architecture Documentation - Task Manager


## 📑 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [API Design](#api-design)
4. [Data Flow](#data-flow)
5. [Security](#security)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  index.html  │  │  tasks.html  │  │  styles.css  │      │
│  │  (Login/Reg) │  │ (Task CRUD)  │  │  (UI/Theme)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                  │                                  │
│         └──────────┬───────┘                                 │
│                    │                                          │
│              ┌─────▼──────┐                                  │
│              │ script.js  │                                  │
│              │ (API Calls)│                                  │
│              └─────┬──────┘                                  │
└────────────────────┼─────────────────────────────────────────┘
                     │ HTTP/JSON (JWT in headers)
                     │
┌────────────────────▼─────────────────────────────────────────┐
│                      SERVER LAYER (Express.js)               │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                     server.js                          │ │
│  │  • CORS • Body Parser • Morgan Logger                 │ │
│  │  • Static Files • Routes                              │ │
│  └───────────────────┬────────────────────────────────────┘ │
│                      │                                        │
│         ┌────────────┴────────────┐                         │
│         │                         │                          │
│  ┌──────▼────────┐       ┌───────▼────────┐                │
│  │ Auth Routes   │       │  Task Routes   │                 │
│  │ /api/auth/*   │       │  /api/tasks/*  │                │
│  └──────┬────────┘       └───────┬────────┘                │
│         │                    │    │                          │
│         │               ┌────▼────▼─────┐                   │
│         │               │ Auth Middleware│                   │
│         │               └────┬───────────┘                   │
│         │                    │                                │
│  ┌──────▼────────┐    ┌─────▼────────┐                     │
│  │ Auth          │    │ Task         │                      │
│  │ Controller    │    │ Controller   │                      │
│  └──────┬────────┘    └─────┬────────┘                     │
│         │                    │                                │
│         └────────────┬───────┘                               │
│                      │ Mongoose ODM                          │
└──────────────────────┼───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    DATABASE LAYER (MongoDB)                   │
│                                                               │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │  users          │              │  tasks          │       │
│  │                 │              │                 │       │
│  │  • _id          │              │  • _id          │       │
│  │  • name         │              │  • title        │       │
│  │  • email        │◄─────────────┤  • userId (FK)  │       │
│  │  • password     │   (1-to-N)   │  • status       │       │
│  │  • timestamps   │              │  • isCompleted  │       │
│  └─────────────────┘              │  • estimated... │       │
│                                    │  • actualHours  │       │
│                                    │  • efficiency✨ │       │
│                                    │  • timestamps   │       │
│                                    └─────────────────┘       │
└───────────────────────────────────────────────────────────────┘
```

### MVC Architecture
```
backend/
├── server.js              # Entry point
├── config/db.js          # MongoDB connection
├── models/
│   ├── User.js           # User schema + password hashing
│   └── Task.js           # Task schema + efficiency calc
├── routes/
│   ├── authRoutes.js     # Auth endpoints
│   └── taskRoutes.js     # Task endpoints
├── controllers/
│   ├── authController.js # Register, login logic
│   └── taskController.js # CRUD operations
└── middleware/
    └── authMiddleware.js # JWT verification
```

---

## Technology Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 16+ | Runtime |
| Express.js | 4.18+ | Web framework |
| MongoDB | 5.0+ | Database |
| Mongoose | 8.0+ | ODM |
| JWT | 9.0+ | Authentication |
| bcryptjs | 2.4+ | Password hashing |

### Frontend
| Technology | Purpose |
|-----------|---------|
| HTML5 | Structure |
| CSS3 | Styling + themes |
| JavaScript ES6+ | Client logic |
| localStorage | Token/theme storage |
| Fetch API | HTTP requests |

---


## Data Flow

### Complete Request Lifecycle: Create Task

```
┌──────────────────────────────────────────────────────────────┐
│ 1. CLIENT (tasks.html)                                       │
│    User fills form → clicks "Add Task"                       │
└────────────────────────────┬─────────────────────────────────┘
                             │
                     ┌───────▼──────┐
                     │ script.js    │
                     │ • Get token  │
                     │ • Build JSON │
                     └───────┬──────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│ 2. HTTP REQUEST                                              │
│    POST /api/tasks                                           │
│    Authorization: Bearer <token>                             │
│    Body: { title, status, hours... }                         │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│ 3. SERVER (server.js)                                        │
│    CORS → Body Parser → Morgan → Routes                     │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│ 4. MIDDLEWARE (authMiddleware.js)                            │
│    • Extract token                                           │
│    • Verify JWT                                              │
│    • Attach user to req                                      │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│ 5. CONTROLLER (taskController.createTask)                    │
│    • Get data from req.body                                  │
│    • Get userId from req.user                                │
│    • Create task                                             │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│ 6. MODEL (Task.js)                                           │
│    pre('save') hook:                                         │
│    • Calculate efficiency ✨                                 │
│    • Validate fields                                         │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│ 7. DATABASE (MongoDB)                                        │
│    • Insert document                                         │
│    • Generate _id, timestamps                                │
│    • Return saved task                                       │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│ 8. RESPONSE (201 Created)                                    │
│    { _id, title, efficiency: 125.5, ... }                   │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│ 9. CLIENT (script.js)                                        │
│    • Parse response                                          │
│    • Show success message                                    │
│    • Reload task list                                        │
│    • Update UI                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Security

### Authentication Flow

```
1. User submits credentials
       ↓
2. Server validates + hashes password (bcrypt)
       ↓
3. Server generates JWT token (7-day expiry)
       ↓
4. Client stores token in localStorage
       ↓
5. Client includes token in requests:
   Authorization: Bearer <token>
       ↓
6. Server verifies token via middleware
       ↓
7. Controller processes with user context
```

### Security Measures

| Layer | Implementation |
|-------|----------------|
| **Passwords** | bcrypt hashing (10 salt rounds) |
| **Authentication** | JWT with 7-day expiry |
| **Authorization** | Middleware on protected routes |
| **Data Isolation** | Filter queries by userId |
| **Input Validation** | Mongoose schema validation |
| **Secrets** | Environment variables (.env) |
| **CORS** | Configured for production |
| **HTTPS** | Enforced by Vercel |

---

## Deployment

### Production Architecture

```
┌───────────────────┐
│  Vercel CDN       │  Frontend static files
│  Edge Network     │
└─────────┬─────────┘
          │
┌─────────▼─────────┐
│  Vercel Serverless│  Backend API (Node.js)
└─────────┬─────────┘
          │
┌─────────▼─────────┐
│  MongoDB Atlas    │  Database (Cloud)
└───────────────────┘
---

## Features Checklist

### Required Fields ✅
- ✅ **Text Field**: Task title
- ✅ **Enum Field**: Status (Pending/In Progress/Done)
- ✅ **Boolean Field**: isCompleted
- ✅ **Calculated Field**: Efficiency (from estimatedHours & actualHours)

### Core Features ✅
- ✅ **Pagination**: 5 tasks per page
- ✅ **Filter**: By status
- ✅ **Search**: Case-insensitive title search
- ✅ **Sorting**: By creation date (newest first)

### Additional Features ✅
- ✅ **Authentication**: JWT-based with bcrypt
- ✅ **Dark Mode**: Toggle with localStorage persistence
- ✅ **Responsive Design**: Mobile, tablet, desktop
- ✅ **Real-time Updates**: Auto-refresh on changes

---



## Error Handling

### HTTP Status Codes
- **200**: Success (GET, PUT, DELETE)
- **201**: Created (POST)
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing/invalid token)
- **404**: Not Found
- **500**: Server Error

### Error Response Format
```json
{
  "message": "Descriptive error message"
}
```

---

## Testing

### API Testing with Postman
1. Register user → Get token
2. Login → Verify token
3. Create tasks → Verify efficiency calculation
4. Get tasks → Test pagination, filters, search
5. Update task → Verify efficiency recalculation
6. Delete task → Verify removal
7. Test without token → Expect 401

📖 **[Test with Postman Collection](https://documenter.getpostman.com/view/48796480/2sB3QGvCGf)**

---

