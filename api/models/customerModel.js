var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

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
    status: { type: Schema.Types.ObjectId, ref: 'WorkflowStatus', required: true },
    list_pos: { type: Number, required: true, unique: true },
    workflow_pos: { type: Number, required: true, unique: true },
    is_archived: { type: Boolean, default: false }
},
{
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// static methods
CustomerSchema.statics.getById = function(id, callback) {
    this.findById(id)
        .populate('status')
        .exec(callback);
};

module.exports = mongoose.model('Customer', CustomerSchema);