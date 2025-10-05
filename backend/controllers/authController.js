const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
	const secret = process.env.JWT_SECRET || 'devsecret';
	return jwt.sign({ id }, secret, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Please provide name, email and password' });
		}
		const exists = await User.findOne({ email });
		if (exists) return res.status(400).json({ message: 'User already exists' });
		const user = await User.create({ name, email, password });
		return res.status(201).json({
			user: { id: user._id, name: user.name, email: user.email },
			token: generateToken(user._id),
		});
	} catch (err) {
		// Log for debugging during development
		console.error('Register error:', err);
		if (err && err.code === 11000) {
			return res.status(400).json({ message: 'Email already registered' });
		}
		if (err && err.name === 'ValidationError') {
			const first = Object.values(err.errors)[0];
			return res.status(400).json({ message: first?.message || 'Invalid data' });
		}
		return res.status(500).json({ message: 'Server error' });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ message: 'Please provide email and password' });
		}
		const user = await User.findOne({ email });
		if (!user) return res.status(400).json({ message: 'Invalid credentials' });
		const match = await user.matchPassword(password);
		if (!match) return res.status(400).json({ message: 'Invalid credentials' });
		return res.json({
			user: { id: user._id, name: user.name, email: user.email },
			token: generateToken(user._id),
		});
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
};


