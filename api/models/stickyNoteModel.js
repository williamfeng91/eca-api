var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var StickyNoteSchema = new Schema({
  text: { type: String, required: true },
  pos: { type: Number, required: true, unique: true, sparse: true }
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

if (!StickyNoteSchema.options.toObject) {
  StickyNoteSchema.options.toObject = {};
}
StickyNoteSchema.options.toObject.transform
  = function (doc, ret, options) {
  // remove the __v of every document before returning the result
  delete ret.__v;
}

module.exports = mongoose.model('StickyNote', StickyNoteSchema);