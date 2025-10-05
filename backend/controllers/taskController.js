const Task = require('../models/Task');

exports.createTask = async (req, res) => {
	try {
		const { title, status, isCompleted, estimatedHours, actualHours } = req.body;
		if (!title || estimatedHours == null || actualHours == null) {
			return res.status(400).json({ message: 'Missing required fields' });
		}
		const task = await Task.create({
			title,
			status,
			isCompleted,
			estimatedHours,
			actualHours,
			userId: req.user.id,
		});
		return res.status(201).json(task);
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
};

exports.getTasks = async (req, res) => {
	try {
		const page = parseInt(req.query.page || '1', 10);
		const limit = parseInt(req.query.limit || '5', 10);
		const status = req.query.status;
		const search = req.query.search;

		const filter = { userId: req.user.id };
		if (status) filter.status = status;
		if (search) filter.title = { $regex: search, $options: 'i' };

		const skip = (page - 1) * limit;
		const [tasks, total] = await Promise.all([
			Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Task.countDocuments(filter),
		]);

		return res.json({ tasks, total, page, limit });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
};

exports.updateTask = async (req, res) => {
	try {
		const existing = await Task.findOne({ _id: req.params.id, userId: req.user.id });
		if (!existing) return res.status(404).json({ message: 'Task not found' });

		const payload = { ...req.body };
		const willChangeEst = Object.prototype.hasOwnProperty.call(payload, 'estimatedHours');
		const willChangeAct = Object.prototype.hasOwnProperty.call(payload, 'actualHours');
		if (willChangeEst || willChangeAct) {
			const est = willChangeEst ? Number(payload.estimatedHours) : existing.estimatedHours;
			const act = willChangeAct ? Number(payload.actualHours) : existing.actualHours;
			payload.efficiency = act > 0 ? Number(((est / act) * 100).toFixed(2)) : 0;
		}
		if (typeof payload.status === 'string' && !Object.prototype.hasOwnProperty.call(payload, 'isCompleted')) {
			payload.isCompleted = payload.status === 'Done';
		}

		const updated = await Task.findOneAndUpdate(
			{ _id: req.params.id, userId: req.user.id },
			payload,
			{ new: true, runValidators: true }
		);
		return res.json(updated);
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
};

exports.deleteTask = async (req, res) => {
	try {
		const deleted = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
		if (!deleted) return res.status(404).json({ message: 'Task not found' });
		return res.json({ message: 'Task deleted' });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
};


