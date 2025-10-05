# Task Manager Web App

Complete end-to-end Task Manager with JWT auth, CRUD, pagination, filters, and derived efficiency field.

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (bcrypt for passwords)

## Features
- User registration & login with JWT tokens
- Task CRUD operations (Create, Read, Update, Delete)
- Pagination (default 5 per page)
- Filter by status (Pending, In Progress, Done)
- Search by title (case-insensitive)
- Auto-calculated efficiency: `(estimatedHours / actualHours) * 100`
- Protected routes with JWT middleware

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Copy `env.example` to `.env` and update values:
```bash
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shipsy_tasks
JWT_SECRET=your_strong_secret_key
```

### 3. Start MongoDB
Make sure MongoDB is running locally on port 27017, or use a cloud instance (MongoDB Atlas).

### 4. Run Development Server
```bash
npm run dev
```

### 5. Access the App
Open your browser and visit: **http://localhost:5000**

## Usage

1. **Register**: Create an account on the landing page
2. **Login**: Sign in with your credentials
3. **Manage Tasks**: Add, edit, delete, filter, and search tasks
4. **Logout**: Click logout to clear your session

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Tasks (Protected)
- `POST /api/tasks` - Create a new task
- `GET /api/tasks?page=1&limit=5&status=Pending&search=query` - Get tasks with filters
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

## Project Structure
```
shipsy/
├── backend/
│   ├── server.js
│   ├── config/db.js
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── taskRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── taskController.js
│   └── middleware/authMiddleware.js
├── frontend/
│   ├── index.html
│   ├── tasks.html
│   ├── script.js
│   └── styles.css
├── package.json
└── README.md
```

## Notes
- JWT tokens are stored in localStorage and sent via `Authorization: Bearer <token>` header
- Efficiency is automatically calculated when creating/updating tasks
- Password hashing uses bcrypt with salt rounds of 10
