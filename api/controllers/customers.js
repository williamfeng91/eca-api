'use strict';

var util = require('util');
var boom = require('boom');
var models = require('../models');
var Customer = models.Customer;

module.exports = {
    // createCustomer: createCustomer,
    getCustomerById: getCustomerById
};

// function createCustomer(req, res) {
//     var customer = new Customer(req);
//     customer.save(function(err, newCustomer) {
//         if (err)
//     });
// }

function getCustomerById(req, res, next) {
    var id = req.swagger.params.customerId.value;
    Customer.getById(id, function(err, customer) {
        if (err) {
            res.status(500).json((new boom.badImplementation()).output.payload);
        } else if (!customer) {
            res.status(404).json((new boom.notFound('The customer was not found')).output.payload);
        } else {
            res.json(customer);
        }
    });
}
