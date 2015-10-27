var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var WorkflowStatusSchema = new Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
  pos: { type: Number, required: true, unique: true }
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

if (!WorkflowStatusSchema.options.toObject) WorkflowStatusSchema.options.toObject = {};
WorkflowStatusSchema.options.toObject.transform = function (doc, ret, options) {
  // remove the __v of every document before returning the result
  delete ret.__v;
}

// static methods
WorkflowStatusSchema.statics.getById = function(id, callback) {
  this.findById(id, callback);
};

module.exports = mongoose.model('WorkflowStatus', WorkflowStatusSchema);