const mongoose = require('mongoose');

const connectDB = async () => {
	const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shipsy_tasks';
	try {
		await mongoose.connect(mongoUri);
		console.log('MongoDB connected');
	} catch (err) {
		console.error('MongoDB connection error:', err.message);
		process.exit(1);
	}
};

module.exports = connectDB;


