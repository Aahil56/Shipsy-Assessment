const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
	{
		title: { type: String, required: true, trim: true },
		status: { type: String, enum: ['Pending', 'In Progress', 'Done'], default: 'Pending' },
		isCompleted: { type: Boolean, default: false },
		estimatedHours: { type: Number, required: true, min: 0 },
		actualHours: { type: Number, required: true, min: 0 },
		efficiency: { type: Number, default: 0 },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	},
	{ timestamps: true }
);

TaskSchema.pre('save', function (next) {
	if (this.actualHours > 0) {
		this.efficiency = Number(((this.estimatedHours / this.actualHours) * 100).toFixed(2));
	} else {
		this.efficiency = 0;
	}
	next();
});

TaskSchema.pre('findOneAndUpdate', function (next) {
	const update = this.getUpdate() || {};
	const set = update.$set || update;
	const hasEst = Object.prototype.hasOwnProperty.call(set, 'estimatedHours');
	const hasAct = Object.prototype.hasOwnProperty.call(set, 'actualHours');
	if (hasEst || hasAct) {
		const est = Number(set.estimatedHours);
		const act = Number(set.actualHours);
		if (!Number.isNaN(est) && !Number.isNaN(act)) {
			const eff = act > 0 ? Number(((est / act) * 100).toFixed(2)) : 0;
			this.setUpdate({ ...update, efficiency: eff });
		}
	}
	next();
});

module.exports = mongoose.model('Task', TaskSchema);


