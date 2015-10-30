var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ChecklistItem = require('./checklistItemModel');

var ChecklistSchema = new Schema({
  name: { type: String, required: true },
  pos: { type: Number, required: true, unique: true, sparse: true },
  items: [ChecklistItem.schema],
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
});

if (!ChecklistSchema.options.toObject) {
  ChecklistSchema.options.toObject = {};
}
ChecklistSchema.options.toObject.transform
  = function (doc, ret, options) {
  // remove the __v of every document before returning the result
  delete ret.__v;
}

module.exports = mongoose.model('Checklist', ChecklistSchema);