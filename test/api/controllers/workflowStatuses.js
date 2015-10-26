var should = require('should');
var request = require('supertest');
var mongoose = require('mongoose');

var server = require('../../../app');
var models = require('../../../api/models');
var WorkflowStatus = models.WorkflowStatus;

describe('controllers', function() {

  describe('workflowStatuses', function() {

    var existingStatus = {
      _id: mongoose.Types.ObjectId(),
      name: 'existingStatus',
      color: 'red',
      pos: 99999,
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(function(done) {
      // empty the collection before test
      WorkflowStatus.remove({}, function(err) {
        // insert one workflow status to be used by test cases
        mongoose.connection.collection('workflowstatuses')
          .insert(existingStatus);
        done();
      });
    });

    describe('POST /workflow-statuses', function() {

      it('should return 201 and the resource if successfully created',
      function(done) {

        var newStatus = {
          name: 'testStatus',
          color: 'green',
        };

        request(server)
          .post('/api/v0/workflow-statuses')
          .set('Accept', 'application/json')
          .send(newStatus)
          .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.have.property('_id');
            res.body.name.should.eql(newStatus.name);
            res.body.color.should.eql(newStatus.color);
            res.body.should.have.property('pos');
            res.body.should.have.property('created_at');
            res.body.should.have.property('updated_at');
            res.body.created_at.should.eql(res.body.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter is missing', function(done) {

        request(server)
          .post('/api/v0/workflow-statuses')
          .set('Accept', 'application/json')
          .send({})
          .expect('Content-Type', /json/)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(400);
            res.body.error.should.eql('Bad Request');

            done();
          });
      });

      it('should return 400 if a parameter has invalid value', function(done) {

        request(server)
          .post('/api/v0/workflow-statuses')
          .set('Accept', 'application/json')
          .send({
            name: 'testStatus',
            color: 'not_a_color',
          })
          .expect('Content-Type', /json/)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(400);
            res.body.error.should.eql('Bad Request');

            done();
          });
      });

      it('should return 409 if a parameter has conflicting value',
      function(done) {

        request(server)
          .post('/api/v0/workflow-statuses')
          .set('Accept', 'application/json')
          .send({
            name: existingStatus.name,
            color: existingStatus.color,
            pos: existingStatus.pos,
          })
          .expect('Content-Type', /json/)
          .expect(409)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(409);
            res.body.error.should.eql('Conflict');

            done();
          });
      });
    });

    describe('GET /workflow-statuses', function() {

      it('should return 200 if successful', function(done) {

        request(server)
          .get('/api/v0/workflow-statuses')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.be.instanceOf(Array).and.have.lengthOf(1);
            res.body[0]._id.should.be.eql(existingStatus._id.toString());

            done();
          });
      });
    });

    describe('GET /workflow-statuses/{workflowStatusId}', function() {

      it('should return 200 if successful', function(done) {

        request(server)
          .get('/api/v0/workflow-statuses/' + existingStatus._id)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingStatus._id.toString());
            res.body.name.should.eql(existingStatus.name);
            res.body.color.should.eql(existingStatus.color);
            res.body.pos.should.eql(existingStatus.pos);
            new Date(res.body.created_at).should
              .eql(existingStatus.created_at);
            new Date(res.body.updated_at).should
              .eql(existingStatus.updated_at);

            done();
          });
      });

      it('should return 404 if id is invalid', function(done) {

        request(server)
          .get('/api/v0/workflow-statuses/000')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(404);
            res.body.error.should.eql('Not Found');

            done();
          });
      });

      it('should return 404 if not found', function(done) {

        request(server)
          .get('/api/v0/workflow-statuses/000000000000000000000000')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(404);
            res.body.error.should.eql('Not Found');

            done();
          });
      });
    });

    describe('PUT /workflow-statuses/{workflowStatusId}', function() {

      it('should return 200 if successfully updated', function(done) {

        var updatedStatus = {
          _id: existingStatus._id.toString(),
          name: 'updatedName',
          color: 'black',
          pos: 88888,
        };

        request(server)
          .put('/api/v0/workflow-statuses/' + existingStatus._id)
          .set('Accept', 'application/json')
          .send(updatedStatus)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingStatus._id.toString());
            res.body.name.should.eql(updatedStatus.name);
            res.body.color.should.eql(updatedStatus.color);
            res.body.pos.should.eql(updatedStatus.pos);
            new Date(res.body.created_at).should
              .eql(existingStatus.created_at);
            new Date(res.body.updated_at).should.be
              .greaterThan(existingStatus.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter is missing', function(done) {

        request(server)
          .put('/api/v0/workflow-statuses/' + existingStatus._id)
          .set('Accept', 'application/json')
          .send({})
          .expect('Content-Type', /json/)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(400);
            res.body.error.should.eql('Bad Request');

            done();
          });
      });

      it('should return 400 if a parameter has invalid value', function(done) {

        request(server)
          .put('/api/v0/workflow-statuses/' + existingStatus._id)
          .set('Accept', 'application/json')
          .send({
            _id: existingStatus._id.toString(),
            name: 'testStatus',
            color: 'not_a_color',
            pos: 88888,
          })
          .expect('Content-Type', /json/)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(400);
            res.body.error.should.eql('Bad Request');

            done();
          });
      });

      it('should return 404 if id is invalid', function(done) {

        request(server)
          .put('/api/v0/workflow-statuses/000')
          .set('Accept', 'application/json')
          .send({
            _id: '000000000000000000000000',
            name: existingStatus.name,
            color: existingStatus.color,
            pos: existingStatus.pos,
          })
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(404);
            res.body.error.should.eql('Not Found');

            done();
          });
      });

      it('should return 404 if not found', function(done) {

        request(server)
          .put('/api/v0/workflow-statuses/000000000000000000000000')
          .set('Accept', 'application/json')
          .send({
            _id: '000000000000000000000000',
            name: existingStatus.name,
            color: existingStatus.color,
            pos: existingStatus.pos,
          })
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(404);
            res.body.error.should.eql('Not Found');

            done();
          });
      });

      it('should return 409 if a parameter has conflicting value',
      function(done) {

        // insert another workflow status to product conflict
        mongoose.connection.collection('workflowstatuses').insert({
          name: 'conflictStatus',
          color: 'orange',
          pos: 88888
        });

        request(server)
          .put('/api/v0/workflow-statuses/' + existingStatus._id)
          .set('Accept', 'application/json')
          .send({
            _id: existingStatus._id.toString(),
            name: existingStatus.name,
            color: existingStatus.color,
            pos: 88888,
          })
          .expect('Content-Type', /json/)
          .expect(409)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(409);
            res.body.error.should.eql('Conflict');

            done();
          });
      });
    });

    describe('PATCH /workflow-statuses/{workflowStatusId}', function() {

      it('should return 200 if successfully updated', function(done) {

        var updateStatusPatch = {
          name: 'updatedName',
          color: 'black',
        };

        request(server)
          .patch('/api/v0/workflow-statuses/' + existingStatus._id)
          .set('Accept', 'application/merge-patch+json')
          .send(updateStatusPatch)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingStatus._id.toString());
            res.body.name.should.eql(updateStatusPatch.name);
            res.body.color.should.eql(updateStatusPatch.color);
            res.body.pos.should.eql(existingStatus.pos);
            new Date(res.body.created_at).should
              .eql(existingStatus.created_at);
            new Date(res.body.updated_at).should.be
              .greaterThan(existingStatus.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter has invalid value', function(done) {

        request(server)
          .patch('/api/v0/workflow-statuses/' + existingStatus._id)
          .set('Accept', 'application/merge-patch+json')
          .send({
            name: 'testStatus',
            color: 'not_a_color',
            pos: 88888,
          })
          .expect('Content-Type', /json/)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(400);
            res.body.error.should.eql('Bad Request');

            done();
          });
      });

      it('should return 404 if id is invalid', function(done) {

        request(server)
          .patch('/api/v0/workflow-statuses/000')
          .set('Accept', 'application/merge-patch+json')
          .send({
            name: existingStatus.name,
            color: existingStatus.color,
            pos: existingStatus.pos,
          })
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(404);
            res.body.error.should.eql('Not Found');

            done();
          });
      });

      it('should return 404 if not found', function(done) {

        request(server)
          .patch('/api/v0/workflow-statuses/000000000000000000000000')
          .set('Accept', 'application/merge-patch+json')
          .send({
            name: existingStatus.name,
            color: existingStatus.color,
            pos: existingStatus.pos,
          })
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(404);
            res.body.error.should.eql('Not Found');

            done();
          });
      });

      it('should return 409 if a parameter has conflicting value',
      function(done) {

        // insert another workflow status to product conflict
        mongoose.connection.collection('workflowstatuses').insert({
          name: 'conflictStatus',
          color: 'orange',
          pos: 88888
        });

        request(server)
          .patch('/api/v0/workflow-statuses/' + existingStatus._id)
          .set('Accept', 'application/merge-patch+json')
          .send({
            name: existingStatus.name,
            color: existingStatus.color,
            pos: 88888,
          })
          .expect('Content-Type', /json/)
          .expect(409)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(409);
            res.body.error.should.eql('Conflict');

            done();
          });
      });
    });

    describe('DELETE /workflow-statuses/{workflowStatusId}', function() {

      it('should return 204 if successful', function(done) {

        request(server)
          .delete('/api/v0/workflow-statuses/' + existingStatus._id)
          .set('Accept', 'application/json')
          .expect(204)
          .end(function(err, res) {
            should.not.exist(err);

            done();
          });
      });

      it('should return 404 if id is invalid', function(done) {

        request(server)
          .delete('/api/v0/workflow-statuses/000')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(404);
            res.body.error.should.eql('Not Found');

            done();
          });
      });

      it('should return 404 if not found', function(done) {

        request(server)
          .delete('/api/v0/workflow-statuses/000000000000000000000000')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(404);
            res.body.error.should.eql('Not Found');

            done();
          });
      });
    });

  });

});
