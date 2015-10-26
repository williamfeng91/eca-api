'use strict';

var mongoose = require('mongoose');
var logger = require('log4js').getLogger('WorkflowStatus Controller');
var util = require('util');
var boom = require('boom');
var jsonmergepatch = require('json-merge-patch');

var models = require('../models');
var WorkflowStatus = models.WorkflowStatus;

var DUPLICATE_FOUND = 'Found duplicate';
var WORKFLOW_STATUS_NOT_FOUND = 'The workflow status was not found';

module.exports = {
  createWorkflowStatus: createWorkflowStatus,
  getWorkflowStatuses: getWorkflowStatuses,
  getWorkflowStatusById: getWorkflowStatusById,
  updateWorkflowStatus: updateWorkflowStatus,
  partialUpdateWorkflowStatus: partialUpdateWorkflowStatus,
  deleteWorkflowStatus: deleteWorkflowStatus
};

function createWorkflowStatus(req, res, next) {
  var workflowStatus = new WorkflowStatus({
    name: req.body.name,
    color: req.body.color,
    pos: req.body.pos || 0
  });
  workflowStatus.save(function(err, newWorkflowStatus) {
    if (err) {
      logger.error(err);
      if (err.code === 11000) {
          // duplicate key error
          return next(new boom.conflict(DUPLICATE_FOUND));
      }
      return next(new boom.badImplementation());
    } else {
      res.status(201).json(newWorkflowStatus.toObject());
    }
  });
}

function getWorkflowStatuses(req, res, next) {
  WorkflowStatus.find({}, function(err, workflowStatuses) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!workflowStatuses) {
      // return an empty array if no data found
      res.json([]);
    } else {
      res.json(workflowStatuses);
    }
  });
}

function getWorkflowStatusById(req, res, next) {
  var id = req.swagger.params.workflowStatusId.value;
  try {
    var _id = mongoose.Types.ObjectId(id);
  } catch (err) {
    return next(new boom.notFound(WORKFLOW_STATUS_NOT_FOUND));
  }
  WorkflowStatus.getById(_id, function(err, workflowStatus) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!workflowStatus) {
      return next(new boom.notFound(WORKFLOW_STATUS_NOT_FOUND))
    } else {
      res.json(workflowStatus.toObject());
    }
  });
}

function updateWorkflowStatus(req, res, next) {
  var id = req.swagger.params.workflowStatusId.value;
  try {
    var _id = mongoose.Types.ObjectId(id);
    if (req.body._id != id) {
      return next(new boom.badRequest('Wrong workflow status ID'));
    }
  } catch (err) {
    return next(new boom.notFound(WORKFLOW_STATUS_NOT_FOUND));
  }
  WorkflowStatus.getById(_id, function(err, workflowStatus) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!workflowStatus) {
      return next(new boom.notFound(WORKFLOW_STATUS_NOT_FOUND));
    } else {
      workflowStatus.name = req.body.name;
      workflowStatus.color = req.body.color;
      workflowStatus.pos = req.body.pos;
      workflowStatus.save(function(err, updatedWorkflowStatus) {
        if (err) {
          logger.error(err);
          if (err.code === 11000) {
            // duplicate key error
            return next(new boom.conflict(DUPLICATE_FOUND));
          }
          return next(new boom.badImplementation());
        } else {
          res.json(updatedWorkflowStatus.toObject());
        }
      });
    }
  });
}

function partialUpdateWorkflowStatus(req, res, next) {
  var id = req.swagger.params.workflowStatusId.value;
  WorkflowStatus.getById(_id, function(err, workflowStatus) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!workflowStatus) {
      return next(new boom.notFound(WORKFLOW_STATUS_NOT_FOUND))
    } else {
      workflowStatus = jsonmergepatch.apply(workflowStatus, req.body);
      workflowStatus.save(function(err, updatedWorkflowStatus) {
        if (err) {
          return next(new boom.badImplementation());
        } else {
          res.json(updatedWorkflowStatus.toObject());
        }
      });
    }
  });
}

function deleteWorkflowStatus(req, res, next) {
  var id = req.swagger.params.workflowStatusId.value;
  try {
    var _id = mongoose.Types.ObjectId(id);
  } catch (err) {
    return next(new boom.notFound(WORKFLOW_STATUS_NOT_FOUND));
  }
  WorkflowStatus.getById(_id, function(err, workflowStatus) {
    if (err) {
      logger.error(err);
      return next(new boom.badImplementation());
    } else if (!workflowStatus) {
      return next(new boom.notFound(WORKFLOW_STATUS_NOT_FOUND))
    } else {
      workflowStatus.remove(function(err) {
        if (err) {
          return next(new boom.badImplementation());
        } else {
          res.status(204).send('');
        }
      });
    }
  });
}
