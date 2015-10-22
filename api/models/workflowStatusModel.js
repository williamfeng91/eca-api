var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WorkflowStatusSchema = new Schema({
    name: String,
    color: String
});

module.exports = mongoose.model('WorkflowStatus', WorkflowStatusSchema);