'use strict';

var util = require('util');
var models = require('../models');
var Customer = models.Customer;

module.exports = {
    getCustomerById: getCustomerById
};

function getCustomerById(req, res) {
    var id = req.swagger.params.customerId.value;
    Customer.getById(id, function(err, customer) {
        if (err) {
            console.log(err);
        } else {
            res.json(customer);
        }
    });
}
