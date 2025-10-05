# 🏗️ Architecture Documentation - Task Manager

**Live Application**: [https://shipsy-task-manager.vercel.app/](https://shipsy-task-manager.vercel.app/)  
**API Documentation**: [Postman Docs](https://documenter.getpostman.com/view/48796480/2sB3QGvCGf)

---

## 📑 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Design](#api-design)
5. [Data Flow](#data-flow)
6. [Security](#security)

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

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,              // Auto-generated
  name: String,               // Required, min 2 chars
  email: String,              // Required, unique, indexed
  password: String,           // Required, bcrypt hashed
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-updated
}
```

**Indexes**: `{ email: 1 }` (unique)

**Sample Document**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "createdAt": "2025-10-05T10:30:00.000Z",
  "updatedAt": "2025-10-05T10:30:00.000Z"
}
```

---

### Tasks Collection

```javascript
{
  _id: ObjectId,                    // Auto-generated
  title: String,                    // Required, trimmed
  status: String,                   // Enum: "Pending", "In Progress", "Done"
  isCompleted: Boolean,             // Auto-set when status = "Done"
  estimatedHours: Number,           // Required, >= 0
  actualHours: Number,              // Required, >= 0
  efficiency: Number,               // ✨ Calculated automatically
  userId: ObjectId,                 // Reference to users
  createdAt: Date,                  // Auto-generated
  updatedAt: Date                   // Auto-updated
}
```

**Indexes**: `{ userId: 1, createdAt: -1 }` (compound)

**Calculated Field - Efficiency**:
```javascript
efficiency = (estimatedHours / actualHours) * 100

// Examples:
// Estimated: 5h, Actual: 4h → 125% (ahead of schedule)
// Estimated: 5h, Actual: 5h → 100% (on time)
// Estimated: 5h, Actual: 8h → 62.5% (behind schedule)
```

**Sample Document**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Implement user authentication",
  "status": "Done",
  "isCompleted": true,
  "estimatedHours": 8,
  "actualHours": 6,
  "efficiency": 133.33,
  "userId": "507f1f77bcf86cd799439011",
  "createdAt": "2025-10-05T09:00:00.000Z",
  "updatedAt": "2025-10-05T15:30:00.000Z"
}
```

---

### Relationships

```
users (1) ────< (N) tasks
  _id  ←───────── userId

• One user → Many tasks
• One task → One user
• Foreign key: userId in tasks collection
```

---

## API Design

### Endpoints Overview

**Base URL**: `https://shipsy-task-manager.vercel.app`

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | No | Create new user |
| `/api/auth/login` | POST | No | Authenticate user |
| `/api/tasks` | POST | Yes | Create task |
| `/api/tasks` | GET | Yes | List tasks (paginated) |
| `/api/tasks/:id` | PUT | Yes | Update task |
| `/api/tasks/:id` | DELETE | Yes | Delete task |

📖 **[Full API Documentation](https://documenter.getpostman.com/view/48796480/2sB3QGvCGf)**

---

### Authentication Examples

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}

Response (201):
{
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure123"
}

Response (200):
{
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Task Operations

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Complete API documentation",
  "status": "Pending",
  "isCompleted": false,
  "estimatedHours": 4,
  "actualHours": 3
}

Response (201):
{
  "_id": "...",
  "title": "Complete API documentation",
  "status": "Pending",
  "efficiency": 133.33,  ← Auto-calculated
  "userId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### Get Tasks (with Filters)
```http
GET /api/tasks?page=1&limit=5&status=Pending&search=api
Authorization: Bearer <token>

Response (200):
{
  "tasks": [ /* array of task objects */ ],
  "total": 12,
  "page": 1,
  "limit": 5,
  "pages": 3
}
```

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
```

### Environment Variables

```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/shipsy_tasks
JWT_SECRET=<64-character-random-string>
SESSION_SECRET=<64-character-random-string>
```

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

## Performance

### Backend Optimizations
- Database indexing (compound index on userId + createdAt)
- Parallel queries with `Promise.all()`
- Lean queries for better performance
- Pagination to limit response size

### Frontend Optimizations
- localStorage for token/theme persistence
- Vanilla JavaScript (no framework overhead)
- CSS variables for instant theme switching
- Minimal HTTP requests

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

## Quick Reference

### Project Files
```
shipsy/
├── backend/
│   ├── server.js           # Express app
│   ├── config/db.js        # MongoDB connection
│   ├── models/             # User & Task schemas
│   ├── routes/             # API endpoints
│   ├── controllers/        # Business logic
│   └── middleware/         # JWT auth
├── frontend/
│   ├── index.html          # Login/Register
│   ├── tasks.html          # Task management
│   ├── script.js           # Client logic
│   └── styles.css          # Styling + themes
├── docs/                   # Screenshots & commits
├── package.json            # Dependencies
├── vercel.json             # Deployment config
└── .env                    # Environment variables
```

### Key Technologies
- **Backend**: Node.js + Express.js + MongoDB + Mongoose
- **Auth**: JWT + bcryptjs
- **Frontend**: HTML + CSS + Vanilla JavaScript
- **Deployment**: Vercel + MongoDB Atlas

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Live Demo**: [https://shipsy-task-manager.vercel.app/](https://shipsy-task-manager.vercel.app/)  
**API Docs**: [Postman Documentation](https://documenter.getpostman.com/view/48796480/2sB3QGvCGf)
