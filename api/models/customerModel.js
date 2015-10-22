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

CustomerSchema.pre('save', function(next) {
    var now = new Date();

    // update the updated_at field
    this.updated_at = now;

    // if item is new, add created_at
    if (!this.created_at) {
        this.created_at = now;
    }

    next();
});

var Customer = mongoose.model('Customer', CustomerSchema);

Customer.getById = function(id, callback) {
    Customer.findById(id)
        .populate('status')
        .exec(callback);
};

module.exports = Customer;