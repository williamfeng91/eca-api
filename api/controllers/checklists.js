'use strict';

var mongoose = require('mongoose');
var logger = require('log4js').getLogger('Checklist Controller');
var util = require('util');
var boom = require('boom');
var jsonmergepatch = require('json-merge-patch');
var constants = require('../helpers/constants');

var models = require('../models');
var Customer = models.Customer;
var Checklist = models.Checklist;

var CHECKLIST_NOT_FOUND = 'The checklist was not found';
var CUSTOMER_NOT_FOUND = 'The customer was not found';
var DUPLICATE_FOUND = 'Found duplicate';
var WRONG_ID = 'Wrong checklist ID';

module.exports = {
  createChecklist: createChecklist,
  getChecklists: getChecklists,
  getChecklistById: getChecklistById,
  updateChecklist: updateChecklist,
  partialUpdateChecklist: partialUpdateChecklist,
  deleteChecklist: deleteChecklist
};

function createChecklist(req, res, next) {
  var customerId = req.swagger.params.customerId.value;
  try {
    var _customerId = mongoose.Types.ObjectId(customerId);
  } catch (err) {
    return next(new boom.notFound(CUSTOMER_NOT_FOUND));
  }
  Customer.findById(_customerId, function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(CUSTOMER_NOT_FOUND))
    }

    var newPos = constants.POS_START_VAL;
    if (req.body.pos != null) {
      // if pos is specified
      // look for duplicate checklist
      for (var i = 0; i < customer.checklists.length; i++) {
        if (customer.checklists[i].pos === req.body.pos) {
          // found duplicate
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
      }
      newPos = req.body.pos;
    } else {
      // if pos is not specified
      // find the current maximum pos
      var maxPos = 0;
      for (var i = 0; i < customer.checklists.length; i++) {
        if (customer.checklists[i].pos > maxPos) {
          maxPos = customer.checklists[i].pos;
        }
      }
      // calculate new pos
      if (customer.checklists.length > 0) {
        newPos = maxPos + constants.POS_AUTO_INCREMENT;
      }
    }
    var checklist = new Checklist({
      name: req.body.name,
      pos: newPos,
    });
    // save
    customer.checklists.push(checklist);
    customer.save(function(err, customer) {
      if (err) {
        logger.error(err);
        if (err.code === 11000) {
            // duplicate key error
            return next(new boom.conflict(DUPLICATE_FOUND));
        }
        return next(new boom.badImplementation());
      }
      return res.status(201)
        .json(customer.checklists.id(checklist._id).toObject());
    });
  });
}

function getChecklists(req, res, next) {
  var customerId = req.swagger.params.customerId.value;
  try {
    var _customerId = mongoose.Types.ObjectId(customerId);
  } catch (err) {
    return next(new boom.notFound(CUSTOMER_NOT_FOUND));
  }
  Customer.findById(_customerId, function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(CUSTOMER_NOT_FOUND))
    }
    return res.json(customer.checklists);
  });
}

function getChecklistById(req, res, next) {
  var checklistId = req.swagger.params.checklistId.value;
  try {
    var _checklistId = mongoose.Types.ObjectId(checklistId);
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_NOT_FOUND));
  }
  Customer.findOne({'checklists._id': _checklistId},
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(CHECKLIST_NOT_FOUND))
    }
    return res.json(customer.checklists.id(_checklistId).toObject());
  });
}

function updateChecklist(req, res, next) {
  var checklistId = req.swagger.params.checklistId.value;
  try {
    var _checklistId = mongoose.Types.ObjectId(checklistId);
    if (req.body._id != checklistId) {
      return next(new boom.badRequest(WRONG_ID));
    }
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_NOT_FOUND));
  }
  var updatedChecklist = req.body;
  Customer.findOne({'checklists._id': _checklistId},
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(CHECKLIST_NOT_FOUND));
    }
    // look for duplicate checklist
    for (var i = 0; i < customer.checklists.length; i++) {
      if (customer.checklists[i]._id !== _checklistId
        && customer.checklists[i].pos === updatedChecklist.pos) {
        // found duplicate
        return next(new boom.conflict(DUPLICATE_FOUND));
      }
    }
    var checklist = customer.checklists.id(_checklistId);
    checklist.name = updatedChecklist.name;
    checklist.pos = updatedChecklist.pos;
    customer.save(function(err, customer) {
      if (err) {
        logger.error(err);
        if (err.code === 11000) {
          // duplicate key error
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
        return next(new boom.badImplementation());
      }
      return res.json(customer.checklists.id(_checklistId).toObject());
    });
  });
}

function partialUpdateChecklist(req, res, next) {
  var checklistId = req.swagger.params.checklistId.value;
  try {
    var _checklistId = mongoose.Types.ObjectId(checklistId);
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_NOT_FOUND));
  }
  var updatePatch = req.body;
  Customer.findOne({'checklists._id': _checklistId},
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(CHECKLIST_NOT_FOUND))
    }
    if (updatePatch.pos) {
      // look for duplicate checklist
      for (var i = 0; i < customer.checklists.length; i++) {
        if (customer.checklists[i]._id !== _checklistId
          && customer.checklists[i].pos === updatePatch.pos) {
          // found duplicate
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
      }
    }
    var checklist = customer.checklists.id(_checklistId);
    checklist = jsonmergepatch.apply(checklist, updatePatch);
    customer.save(function(err, customer) {
      if (err) {
        logger.error(err);
        if (err.code === 11000) {
          // duplicate key error
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
        return next(new boom.badImplementation());
      }
      return res.json(customer.checklists.id(_checklistId).toObject());
    });
  });
}

function deleteChecklist(req, res, next) {
  var checklistId = req.swagger.params.checklistId.value;
  try {
    var _checklistId = mongoose.Types.ObjectId(checklistId);
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_NOT_FOUND));
  }
  Customer.findOne({'checklists._id': _checklistId},
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(CHECKLIST_NOT_FOUND))
    }
    customer.checklists.id(_checklistId).remove();
    customer.save(function(err) {
      if (err) {
        logger.error(err);
        return next(new boom.badImplementation());
      }
      return res.status(204).send('');
    });
  });
}
