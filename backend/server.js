const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

app.get('/tasks', (req, res) => {
	res.sendFile(path.join(frontendDir, 'tasks.html'));
});

app.get('/', (req, res) => {
	res.sendFile(path.join(frontendDir, 'index.html'));
});

// Global error handler (last middleware)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	console.error('Unhandled error:', err);
	res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown to avoid EADDRINUSE on rapid restarts
const shutdown = () => {
	server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);


