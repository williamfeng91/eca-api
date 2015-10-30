var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var ChecklistItemSchema = new Schema({
  text: { type: String, required: true },
  checked: { type: Boolean, required: true, default: false },
  pos: { type: Number, required: true, unique: true, sparse: true },
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
});

if (!ChecklistItemSchema.options.toObject) {
  ChecklistItemSchema.options.toObject = {};
}
ChecklistItemSchema.options.toObject.transform
  = function (doc, ret, options) {
  // remove the __v of every document before returning the result
  delete ret.__v;
}

module.exports = mongoose.model('ChecklistItem', ChecklistItemSchema);