var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WorkflowStatusSchema = new Schema({
    name: { type: String, required: true },
    color: { type: String, required: true },
    pos: { type: Number, required: true, unique: true }
});

WorkflowStatusSchema.statics.getById = function(id, callback) {
    this.findById(id, callback);
};

module.exports = mongoose.model('WorkflowStatus', WorkflowStatusSchema);