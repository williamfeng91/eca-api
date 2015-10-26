'use strict';

var mongoose = require('mongoose');
var logger = require('log4js').getLogger('StickyNote Controller');
var util = require('util');
var boom = require('boom');
var jsonmergepatch = require('json-merge-patch');

var models = require('../models');
var Customer = models.Customer;
var StickyNote = models.StickyNote;

var CUSTOMER_NOT_FOUND = 'The customer was not found';
var DUPLICATE_FOUND = 'Found duplicate';
var STICKY_NOTE_NOT_FOUND = 'The sticky note was not found';
var WRONG_ID = 'Wrong sticky note ID';

module.exports = {
  createStickyNote: createStickyNote,
  getStickyNotes: getStickyNotes,
  getStickyNoteById: getStickyNoteById,
  updateStickyNote: updateStickyNote,
  partialUpdateStickyNote: partialUpdateStickyNote,
  deleteStickyNote: deleteStickyNote
};

function createStickyNote(req, res, next) {
  var stickyNote = new StickyNote({
    text: req.body.text,
    pos: req.body.pos || 0
  });
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
    } else {
      customer.sticky_notes.push(stickyNote);
      customer.save(function(err, customer) {
        if (err) {
          logger.error(err);
          if (err.code === 11000) {
              // duplicate key error
              return next(new boom.conflict(DUPLICATE_FOUND));
          }
          return next(new boom.badImplementation());
        } else {
          res.status(201).json(
            customer.sticky_notes.id(stickyNote._id).toObject());
        }
      });
    }
  });
}

function getStickyNotes(req, res, next) {
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
    } else {
      res.json(customer.sticky_notes);
    }
  });
}

function getStickyNoteById(req, res, next) {
  var stickyNoteId = req.swagger.params.stickyNoteId.value;
  try {
    var _stickyNoteId = mongoose.Types.ObjectId(stickyNoteId);
  } catch (err) {
    return next(new boom.notFound(STICKY_NOTE_NOT_FOUND));
  }
  Customer.findOne({'sticky_notes._id': _stickyNoteId},
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(STICKY_NOTE_NOT_FOUND))
    } else {
      res.json(customer.sticky_notes.id(_stickyNoteId).toObject());
    }
  });
}

function updateStickyNote(req, res, next) {
  var stickyNoteId = req.swagger.params.stickyNoteId.value;
  try {
    var _stickyNoteId = mongoose.Types.ObjectId(stickyNoteId);
    if (req.body._id != stickyNoteId) {
      return next(new boom.badRequest(WRONG_ID));
    }
  } catch (err) {
    return next(new boom.notFound(STICKY_NOTE_NOT_FOUND));
  }
  Customer.findOne({'sticky_notes._id': _stickyNoteId},
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(STICKY_NOTE_NOT_FOUND));
    } else {
      var stickyNote = customer.sticky_notes.id(_stickyNoteId);
      stickyNote.text = req.body.text;
      stickyNote.pos = req.body.pos;
      customer.save(function(err, stickyNote) {
        if (err) {
          logger.error(err);
          if (err.code === 11000) {
            // duplicate key error
            return next(new boom.conflict(DUPLICATE_FOUND));
          }
          return next(new boom.badImplementation());
        } else {
          res.json(
            customer.sticky_notes.id(_stickyNoteId).toObject());
        }
      });
    }
  });
}

function partialUpdateStickyNote(req, res, next) {
  var stickyNoteId = req.swagger.params.stickyNoteId.value;
  try {
    var _stickyNoteId = mongoose.Types.ObjectId(stickyNoteId);
  } catch (err) {
    return next(new boom.notFound(STICKY_NOTE_NOT_FOUND));
  }
  Customer.findOne({'sticky_notes._id': _stickyNoteId},
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(STICKY_NOTE_NOT_FOUND))
    } else {
      var stickyNote = customer.sticky_notes.id(_stickyNoteId);
      stickyNote = jsonmergepatch.apply(stickyNote, req.body);
      customer.save(function(err, stickyNote) {
        if (err) {
          logger.error(err);
          if (err.code === 11000) {
            // duplicate key error
            return next(new boom.conflict(DUPLICATE_FOUND));
          }
          return next(new boom.badImplementation());
        } else {
          res.json(
            customer.sticky_notes.id(_stickyNoteId).toObject());
        }
      });
    }
  });
}

function deleteStickyNote(req, res, next) {
  var stickyNoteId = req.swagger.params.stickyNoteId.value;
  try {
    var _stickyNoteId = mongoose.Types.ObjectId(stickyNoteId);
  } catch (err) {
    return next(new boom.notFound(STICKY_NOTE_NOT_FOUND));
  }
  Customer.findOne({'sticky_notes._id': _stickyNoteId},
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(STICKY_NOTE_NOT_FOUND))
    } else {
      customer.sticky_notes.id(_stickyNoteId).remove();
      customer.save(function(err) {
        if (err) {
          return next(new boom.badImplementation());
        } else {
          res.status(204).send('');
        }
      });
    }
  });
}
