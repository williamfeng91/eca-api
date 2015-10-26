'use strict';

var mongoose = require('mongoose');
var util = require('util');
var boom = require('boom');
var jsonmergepatch = require('json-merge-patch');

var models = require('../models');
var Customer = models.Customer;
var WorkflowStatus = models.WorkflowStatus;

var CUSTOMER_NOT_FOUND = 'The customer was not found';
var WRONG_CUSTOMER_ID = 'Wrong customer ID';

module.exports = {
    createCustomer: createCustomer,
    getCustomers: getCustomers,
    getCustomerById: getCustomerById,
    updateCustomer: updateCustomer,
    partialUpdateCustomer: partialUpdateCustomer,
    // updateCustomerArchived: updateCustomerArchived,
    // updateCustomerBirthday: updateCustomerBirthday,
    // updateCustomerVisaExpiryDate: updateCustomerVisaExpiryDate,
    // updateCustomerProperty: updateCustomerProperty,
    deleteCustomer: deleteCustomer
};

function createCustomer(req, res, next) {
    var statusId = req.body.status;
    try {
        var _statusId = mongoose.Types.ObjectId(statusId);
    } catch (err) {
        return next(new boom.badRequest('Value \'status\' is invalid'));
    }
    WorkflowStatus.getById(_statusId, function(err, status) {
        if (err) {
            return next(new boom.badImplementation());
        } else if (!status) {
            return next(new boom.badRequest('Value \'status\' is invalid'));
        } else {
            var customer = new Customer({
                email: req.body.email,
                surname: req.body.surname,
                given_name: req.body.given_name,
                nickname: req.body.nickname,
                real_name: req.body.real_name,
                gender: req.body.gender,
                birthday: req.body.birthday,
                mobile: req.body.mobile,
                qq: req.body.qq,
                wechat: req.body.wechat,
                au_address: req.body.au_address,
                foreign_address: req.body.foreign_address,
                visa_expiry_date: req.body.visa_expiry_date,
                status: req.body.status,
                is_archived: req.body.is_archived || false,
                list_pos: req.body.list_pos || 0,
                workflow_pos: req.body.workflow_pos || 0
            });
            customer.save(function(err, newCustomer) {
                if (err) {
                    console.error(err);
                    if (err.code == 11000) {
                        // duplicate key error
                        return next(new boom.conflict('Found duplicate field'));
                    }
                    return next(new boom.badImplementation());
                } else {
                    res.status(201).json(newCustomer);
                }
            });
        }
    });
}

function getCustomers(req, res, next) {
    Customer.find({}, function(err, customers) {
        if (err) {
            return next(new boom.badImplementation());
        } else if (!customers) {
            // return an empty array if no data found
            res.json([]);
        } else {
            res.json(customers);
        }
    });
}

function getCustomerById(req, res, next) {
    var id = req.swagger.params.customerId.value;
    try {
        var _id = mongoose.Types.ObjectId(id);
    } catch (err) {
        return next(new boom.notFound(CUSTOMER_NOT_FOUND));
    }
    Customer.getById(_id, function(err, customer) {
        if (err) {
            return next(new boom.badImplementation());
        } else if (!customer) {
            return next(new boom.notFound(CUSTOMER_NOT_FOUND))
        } else {
            res.json(customer);
        }
    });
}

function updateCustomer(req, res, next) {
    var id = req.swagger.params.customerId.value;
    try {
        var _id = mongoose.Types.ObjectId(id);
        if (req.body._id != id) {
            return next(new boom.badRequest(WRONG_CUSTOMER_ID));
        }
    } catch (err) {
        return next(new boom.notFound(CUSTOMER_NOT_FOUND));
    }
    Customer.getById(_id, function(err, customer) {
        if (err) {
            return next(new boom.badImplementation());
        } else if (!customer) {
            return next(new boom.notFound(CUSTOMER_NOT_FOUND));
        } else {
            customer.email = req.body.email;
            customer.surname = req.body.surname;
            customer.given_name = req.body.given_name;
            customer.nickname = req.body.nickname;
            customer.real_name = req.body.real_name;
            customer.gender = req.body.gender;
            customer.birthday = req.body.birthday;
            customer.mobile = req.body.mobile;
            customer.qq = req.body.qq;
            customer.wechat = req.body.wechat;
            customer.au_address = req.body.au_address;
            customer.foreign_address = req.body.foreign_address;
            customer.visa_expiry_date = req.body.visa_expiry_date;
            customer.status = req.body.status;
            customer.is_archived = req.body.is_archived;
            customer.list_pos = req.body.list_pos;
            customer.workflow_pos = req.body.workflow_pos;
            customer.save(function(err, updatedCustomer) {
                if (err) {
                    return next(new boom.badImplementation());
                } else {
                    res.json(updatedCustomer);
                }
            });
        }
    });
}

function partialUpdateCustomer(req, res, next) {
    var id = req.swagger.params.customerId.value;
    Customer.getById(id, function(err, customer) {
        if (err) {
            return next(new boom.badImplementation());
        } else if (!customer) {
            return next(new boom.notFound(CUSTOMER_NOT_FOUND));
        } else {
            customer = jsonmergepatch.apply(customer, req.body);
            customer.save(function(err, updatedCustomer) {
                if (err) {
                    return next(new boom.badImplementation());
                } else {
                    res.json(updatedCustomer);
                }
            });
        }
    });
}

function updateCustomerArchived(req, res, next) {
    var id = req.swagger.params.customerId.value;
    Customer.getById(id, function(err, customer) {
        if (err) {
            return next(new boom.badImplementation());
        } else if (!customer) {
            return next(new boom.notFound(CUSTOMER_NOT_FOUND));
        } else {
            customer.is_archived = req.query.value;
            customer.save(function(err, customer) {
                if (err) {
                    return next(new boom.badImplementation());
                } else {
                    res.json(customer);
                }
            });
        }
    });
}

function updateCustomerBirthday(req, res, next) {
    var id = req.swagger.params.customerId.value;
    Customer.getById(id, function(err, customer) {
        if (err) {
            return next(new boom.badImplementation());
        } else if (!customer) {
            return next(new boom.notFound(CUSTOMER_NOT_FOUND));
        } else {
            customer.birthday = req.query.value;
            customer.save(function(err, customer) {
                if (err) {
                    return next(new boom.badImplementation());
                } else {
                    res.json(customer);
                }
            });
        }
    });
}

function updateCustomerVisaExpiryDate(req, res, next) {
    var id = req.swagger.params.customerId.value;
    Customer.getById(id, function(err, customer) {
        if (err) {
            return next(new boom.badImplementation());
        } else if (!customer) {
            return next(new boom.notFound(CUSTOMER_NOT_FOUND));
        } else {
            customer.visa_expiry_date = req.query.value;
            customer.save(function(err, customer) {
                if (err) {
                    return next(new boom.badImplementation());
                } else {
                    res.json(customer);
                }
            });
        }
    });
}

function updateCustomerProperty(req, res, next) {
    var id = req.swagger.params.customerId.value;
    Customer.getById(id, function(err, customer) {
        if (err) {
            return next(new boom.badImplementation());
        } else if (!customer) {
            return next(new boom.notFound(CUSTOMER_NOT_FOUND));
        } else {
            customer[req.swagger.params.property.value] = req.query.value;
            customer.save(function(err, customer) {
                if (err) {
                    return next(new boom.badImplementation());
                } else {
                    res.json(customer);
                }
            });
        }
    });
}

function deleteCustomer(req, res, next) {
    var id = req.swagger.params.customerId.value;
    try {
        var _id = mongoose.Types.ObjectId(id);
    } catch (err) {
        return next(new boom.notFound(CUSTOMER_NOT_FOUND));
    }
    Customer.getById(_id, function(err, customer) {
        if (err) {
            return next(new boom.badImplementation());
        } else if (!customer) {
            return next(new boom.notFound(CUSTOMER_NOT_FOUND))
        } else {
            customer.remove(function(err) {
                if (err) {
                    return next(new boom.badImplementation());
                } else {
                    res.status(204).send('');
                }
            });
        }
    });
}
