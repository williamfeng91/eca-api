var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var StickyNote = require('./stickyNoteModel');

var CustomerSchema = new Schema({
  email: { type: String, required: true },
  surname: { type: String, required: true },
  given_name: { type: String, required: true },
  nickname: String,
  real_name: String,
  gender: { type: String, required: true },
  birthday: Date,
  mobile: String,
  qq: String,
  wechat: String,
  au_address: String,
  foreign_address: String,
  visa_expiry_date: Date,
  status: {
    type: Schema.Types.ObjectId,
    ref: 'WorkflowStatus',
    required: true
  },
  list_pos: { type: Number, required: true, unique: true },
  workflow_pos: { type: Number, required: true, unique: true },
  is_archived: { type: Boolean, default: false },
  sticky_notes: [StickyNote.schema]
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

if (!CustomerSchema.options.toObject) CustomerSchema.options.toObject = {};
CustomerSchema.options.toObject.transform = function (doc, ret, options) {
    // remove the __v of every document before returning the result
    delete ret.__v;
}

// static methods
CustomerSchema.statics.getById = function(id, callback) {
    this.findById(id)
        .populate('status')
        .exec(callback);
};

CustomerSchema.statics.getMaxListPos = function(callback) {
  this.findOne().sort('-list_pos').exec(callback);
};

CustomerSchema.statics.getMaxWorkflowPos = function(callback) {
  this.findOne().sort('-workflow_pos').exec(callback);
};

module.exports = mongoose.model('Customer', CustomerSchema);