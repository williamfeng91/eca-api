'use strict';

var mongoose = require('mongoose');
var logger = require('log4js').getLogger('StickyNote Controller');
var util = require('util');
var boom = require('boom');
var jsonmergepatch = require('json-merge-patch');
var constants = require('../helpers/constants');

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
      // look for duplicate sticky note
      for (var i = 0; i < customer.sticky_notes.length; i++) {
        if (customer.sticky_notes[i].pos === req.body.pos) {
          // found duplicate
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
      }
      newPos = req.body.pos;
    } else {
      // if pos is not specified
      // find the current maximum pos
      var maxPos = 0;
      for (var i = 0; i < customer.sticky_notes.length; i++) {
        if (customer.sticky_notes[i].pos > maxPos) {
          maxPos = customer.sticky_notes[i].pos;
        }
      }
      // calculate new pos
      if (customer.sticky_notes.length > 0) {
        newPos = maxPos + constants.POS_AUTO_INCREMENT;
      }
    }
    var stickyNote = new StickyNote({
      text: req.body.text,
      pos: newPos,
    });
    // save
    customer.sticky_notes.push(stickyNote);
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
        .json(customer.sticky_notes.id(stickyNote._id).toObject());
    });
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
    }
    return res.json(customer.sticky_notes);
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
    }
    return res.json(customer.sticky_notes.id(_stickyNoteId).toObject());
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
  var updatedStickyNote = req.body;
  Customer.findOne({'sticky_notes._id': _stickyNoteId},
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(STICKY_NOTE_NOT_FOUND));
    }
    // look for duplicate sticky note
    for (var i = 0; i < customer.sticky_notes.length; i++) {
      if (customer.sticky_notes[i]._id !== _stickyNoteId
        && customer.sticky_notes[i].pos === updatedStickyNote.pos) {
        // found duplicate
        return next(new boom.conflict(DUPLICATE_FOUND));
      }
    }
    var stickyNote = customer.sticky_notes.id(_stickyNoteId);
    stickyNote.text = updatedStickyNote.text;
    stickyNote.pos = updatedStickyNote.pos;
    customer.save(function(err, customer) {
      if (err) {
        logger.error(err);
        if (err.code === 11000) {
          // duplicate key error
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
        return next(new boom.badImplementation());
      }
      return res.json(customer.sticky_notes.id(_stickyNoteId).toObject());
    });
  });
}

function partialUpdateStickyNote(req, res, next) {
  var stickyNoteId = req.swagger.params.stickyNoteId.value;
  try {
    var _stickyNoteId = mongoose.Types.ObjectId(stickyNoteId);
  } catch (err) {
    return next(new boom.notFound(STICKY_NOTE_NOT_FOUND));
  }
  var updatePatch = req.body;
  Customer.findOne({'sticky_notes._id': _stickyNoteId},
  function(err, customer) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!customer) {
      return next(new boom.notFound(STICKY_NOTE_NOT_FOUND))
    }
    if (updatePatch.pos) {
      // look for duplicate sticky note
      for (var i = 0; i < customer.sticky_notes.length; i++) {
        if (customer.sticky_notes[i]._id !== _stickyNoteId
          && customer.sticky_notes[i].pos === updatePatch.pos) {
          // found duplicate
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
      }
    }
    var stickyNote = customer.sticky_notes.id(_stickyNoteId);
    stickyNote = jsonmergepatch.apply(stickyNote, updatePatch);
    customer.save(function(err, customer) {
      if (err) {
        logger.error(err);
        if (err.code === 11000) {
          // duplicate key error
          return next(new boom.conflict(DUPLICATE_FOUND));
        }
        return next(new boom.badImplementation());
      }
      return res.json(customer.sticky_notes.id(_stickyNoteId).toObject());
    });
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
    }
    customer.sticky_notes.id(_stickyNoteId).remove();
    customer.save(function(err) {
      if (err) {
        logger.error(err);
        return next(new boom.badImplementation());
      }
      return res.status(204).send('');
    });
  });
}
