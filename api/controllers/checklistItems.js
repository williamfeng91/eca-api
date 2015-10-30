'use strict';

var mongoose = require('mongoose');
var logger = require('log4js').getLogger('ChecklistItem Controller');
var util = require('util');
var boom = require('boom');
var jsonmergepatch = require('json-merge-patch');
var constants = require('../helpers/constants');

var models = require('../models');
var Customer = models.Customer;
var ChecklistItem = models.ChecklistItem;

var CHECKLIST_NOT_FOUND = 'The checklist was not found';
var CHECKLIST_ITEM_NOT_FOUND = 'The checklist item was not found';
var CUSTOMER_NOT_FOUND = 'The checklist was not found';
var DUPLICATE_FOUND = 'Found duplicate';
var WRONG_ID = 'Wrong checklist item ID';

module.exports = {
  createChecklistItem: createChecklistItem,
  getChecklistItems: getChecklistItems,
  getChecklistItemById: getChecklistItemById,
  updateChecklistItem: updateChecklistItem,
  partialUpdateChecklistItem: partialUpdateChecklistItem,
  deleteChecklistItem: deleteChecklistItem
};

function createChecklistItem(req, res, next) {
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
    var checklist = customer.checklists.id(_checklistId);

    var newPos = constants.POS_START_VAL;
    if (req.body.pos != null) {
      // if pos is specified
      // look for duplicate checklistItem
      for (var i in checklist.items) {
        if (checklist.items[i].pos === req.body.pos) {
          // found duplicate
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
      }
      newPos = req.body.pos;
    } else {
      // if pos is not specified
      // find the current maximum pos
      var maxPos = 0;
      for (var i in checklist.items) {
        if (checklist.items[i].pos > maxPos) {
          maxPos = checklist.items[i].pos;
        }
      }
      // calculate new pos
      if (checklist.items.length > 0) {
        newPos = maxPos + constants.POS_AUTO_INCREMENT;
      }
    }
    var checklistItem = new ChecklistItem({
      text: req.body.text,
      checked: (req.body.checked != null) ? req.body.checked : false,
      pos: newPos,
    });
    // save
    checklist.items.push(checklistItem);
    customer.save(function(err, customer) {
      if (err) {
        logger.error(err);
        if (err.code === 11000) {
            // duplicate key error
            return next(new boom.conflict(DUPLICATE_FOUND));
        }
        return next(new boom.badImplementation());
      }
      var checklist = customer.checklists.id(_checklistId);
      return res.status(201)
        .json(checklist.items.id(checklistItem._id).toObject());
    });
  });
}

function getChecklistItems(req, res, next) {
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
    var checklist = customer.checklists.id(_checklistId);
    return res.json(checklist.items);
  });
}

function getChecklistItemById(req, res, next) {
  var checklistId = req.swagger.params.checklistId.value;
  try {
    var _checklistId = mongoose.Types.ObjectId(checklistId);
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_NOT_FOUND));
  }
  var checklistItemId = req.swagger.params.checklistItemId.value;
  try {
    var _checklistItemId = mongoose.Types.ObjectId(checklistItemId);
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_ITEM_NOT_FOUND));
  }
  Customer.findOne({
    'checklists._id': _checklistId,
    'checklists.items._id': _checklistItemId,
  },
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(CHECKLIST_ITEM_NOT_FOUND))
    }
    var checklist = customer.checklists.id(_checklistId);
    return res.json(checklist.items.id(_checklistItemId).toObject());
  });
}

function updateChecklistItem(req, res, next) {
  var checklistId = req.swagger.params.checklistId.value;
  try {
    var _checklistId = mongoose.Types.ObjectId(checklistId);
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_NOT_FOUND));
  }
  var checklistItemId = req.swagger.params.checklistItemId.value;
  try {
    var _checklistItemId = mongoose.Types.ObjectId(checklistItemId);
    if (req.body._id != checklistItemId) {
      return next(new boom.badRequest(WRONG_ID));
    }
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_ITEM_NOT_FOUND));
  }
  var updatedChecklistItem = req.body;
  Customer.findOne({
    'checklists._id': _checklistId,
    'checklists.items._id': _checklistItemId,
  },
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(CHECKLIST_ITEM_NOT_FOUND));
    }
    var checklist = customer.checklists.id(_checklistId);
    // look for duplicate checklistItem
    for (var i in checklist.items) {
      if (checklist.items[i]._id !== _checklistItemId
        && checklist.items[i].pos === updatedChecklistItem.pos) {
        // found duplicate
        return next(new boom.conflict(DUPLICATE_FOUND));
      }
    }
    var checklistItem = checklist.items.id(_checklistItemId);
    checklistItem.text = updatedChecklistItem.text;
    checklistItem.checked = updatedChecklistItem.checked;
    checklistItem.pos = updatedChecklistItem.pos;
    customer.save(function(err, customer) {
      if (err) {
        logger.error(err);
        if (err.code === 11000) {
          // duplicate key error
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
        return next(new boom.badImplementation());
      }
      var checklist = customer.checklists.id(_checklistId);
      return res.json(checklist.items.id(_checklistItemId).toObject());
    });
  });
}

function partialUpdateChecklistItem(req, res, next) {
  var checklistId = req.swagger.params.checklistId.value;
  try {
    var _checklistId = mongoose.Types.ObjectId(checklistId);
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_NOT_FOUND));
  }
  var checklistItemId = req.swagger.params.checklistItemId.value;
  try {
    var _checklistItemId = mongoose.Types.ObjectId(checklistItemId);
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_ITEM_NOT_FOUND));
  }
  var updatePatch = req.body;
  Customer.findOne({
    'checklists._id': _checklistId,
    'checklists.items._id': _checklistItemId,
  },
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(CHECKLIST_ITEM_NOT_FOUND))
    }
    var checklist = customer.checklists.id(_checklistId);
    if (updatePatch.pos) {
      // look for duplicate checklistItem
      for (var i in checklist.items) {
        if (checklist.items[i]._id !== _checklistItemId
          && checklist.items[i].pos === updatePatch.pos) {
          // found duplicate
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
      }
    }
    var checklistItem = checklist.items.id(_checklistItemId);
    checklistItem = jsonmergepatch.apply(checklistItem, updatePatch);
    customer.save(function(err, customer) {
      if (err) {
        logger.error(err);
        if (err.code === 11000) {
          // duplicate key error
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
        return next(new boom.badImplementation());
      }
      var checklist = customer.checklists.id(_checklistId);
      return res.json(checklist.items.id(_checklistItemId).toObject());
    });
  });
}

function deleteChecklistItem(req, res, next) {
  var checklistId = req.swagger.params.checklistId.value;
  try {
    var _checklistId = mongoose.Types.ObjectId(checklistId);
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_NOT_FOUND));
  }
  var checklistItemId = req.swagger.params.checklistItemId.value;
  try {
    var _checklistItemId = mongoose.Types.ObjectId(checklistItemId);
  } catch (err) {
    return next(new boom.notFound(CHECKLIST_ITEM_NOT_FOUND));
  }
  Customer.findOne({
    'checklists._id': _checklistId,
    'checklists.items._id': _checklistItemId,
  },
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(CHECKLIST_ITEM_NOT_FOUND))
    }
    var checklist = customer.checklists.id(_checklistId);
    checklist.items.id(_checklistItemId).remove();
    customer.save(function(err) {
      if (err) {
        logger.error(err);
        return next(new boom.badImplementation());
      }
      return res.status(204).send('');
    });
  });
}
