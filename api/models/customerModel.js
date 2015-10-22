var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CustomerSchema = new Schema({
    email: String,
    surname: String,
    given_name: String,
    nickname: String,
    real_name: String,
    gender: String,
    birthday: Date,
    mobile: String,
    qq: String,
    wechat: String,
    au_address: String,
    foreign_address: String,
    visa_expiry_date: Date,
    status: { type: Schema.Types.ObjectId, ref: 'WorkflowStatus' },
    list_pos: { type: Number, default: 0 },
    workflow_pos: { type: Number, default: 0 },
    is_archived: { type: Boolean, default: false },
    created_at: Date,
    updated_at: Date
});

var Customer = module.exports = mongoose.model('Customer', CustomerSchema);

module.exports.getById = function(id, callback) {
    Customer.findById(id)
        .populate('status')
        .exec(callback);
};