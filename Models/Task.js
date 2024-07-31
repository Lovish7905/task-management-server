const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  category: String,
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, required: true },
  priority: String,
  deadline: String,
});

const TaskModel = mongoose.model("Task", TaskSchema);
module.exports = TaskModel;
