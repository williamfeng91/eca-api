var should = require('should');
var request = require('supertest');
var mongoose = require('mongoose');
var constants = require('../../../api/helpers/constants');

var server = require('../../../app');
var models = require('../../../api/models');
var Customer = models.Customer;
var StickyNote = models.StickyNote;

describe('controllers', function() {

  describe('stickyNotes', function() {

    var existingCustomer = new Customer({
      email: 'a@b.com',
      surname: 'Smith',
      given_name: 'John',
      gender: 'male',
      status: mongoose.Types.ObjectId(),
      list_pos: 99999,
      workflow_pos: 99999,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    var existingStickyNote = new StickyNote({
      text: 'existingNote',
      pos: 99999,
      created_at: new Date(),
      updated_at: new Date(),
    });

    before(function(done) {
      // empty the collection before test
      Customer.remove({}, function(err) {
        if (err) throw err;
        // insert one customer to be used by test cases
        existingCustomer.save(function(err, customer) {
          if (err) throw err;
          if (!customer) throw 'Customer not found';
          done();
        });
      });
    });

    beforeEach(function(done) {
      Customer.findById(existingCustomer._id, function(err, customer) {
        if (err) throw err;
        if (!customer) throw 'Customer not found';
        // empty the array and insert one sticky note to be used by test cases
        customer.sticky_notes = [];
        customer.sticky_notes.push(existingStickyNote);
        customer.save(function(err) {
          if (err) throw err;
          done();
        });
      });
    });

    describe('POST /customers/{customerId}/sticky-notes', function() {

      var newStickyNote = {
        text: 'new note',
      };

      it('should return 201 when inserting into empty database',
      function(done) {

        Customer.findById(existingCustomer._id, function(err, customer) {
          if (err) throw err;
          if (!customer) throw 'Customer not found';
          // empty the array
          customer.sticky_notes = [];
          customer.save(function(err) {
            if (err) throw err;

            request(server)
              .post('/api/v0/customers/' + existingCustomer._id
                  + '/sticky-notes')
              .set('Accept', 'application/json')
              .send(newStickyNote)
              .expect('Content-Type', /json/)
              .expect(201)
              .end(function(err, res) {
                should.not.exist(err);

                res.body.should.have.property('_id');
                res.body.text.should.eql(newStickyNote.text);
                res.body.pos.should.eql(constants.POS_START_VAL);
                res.body.should.have.property('created_at');
                res.body.should.have.property('updated_at');
                res.body.created_at.should.eql(res.body.updated_at);

                done();
              });
          });
        });
      });

      it('should return 201 when inserting into database with existing data',
      function(done) {

        request(server)
          .post('/api/v0/customers/' + existingCustomer._id + '/sticky-notes')
          .set('Accept', 'application/json')
          .send(newStickyNote)
          .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.have.property('_id');
            res.body.text.should.eql(newStickyNote.text);
            res.body.pos.should.eql(
              existingStickyNote.pos + constants.POS_AUTO_INCREMENT);
            res.body.should.have.property('created_at');
            res.body.should.have.property('updated_at');
            res.body.created_at.should.eql(res.body.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter is missing', function(done) {

        request(server)
          .post('/api/v0/customers/' + existingCustomer._id + '/sticky-notes')
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
          .post('/api/v0/customers/' + existingCustomer._id + '/sticky-notes')
          .set('Accept', 'application/json')
          .send({
            text: 'new note',
            pos: 'not_a_number',
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

      it('should return 404 if customer id is invalid', function(done) {

        request(server)
          .post('/api/v0/customers/000/sticky-notes')
          .set('Accept', 'application/json')
          .send({
            text: 'new note',
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

      it('should return 404 if customer not found', function(done) {

        request(server)
          .post('/api/v0/customers/000000000000000000000000/sticky-notes')
          .set('Accept', 'application/json')
          .send({
            text: 'new note',
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

        request(server)
          .post('/api/v0/customers/' + existingCustomer._id + '/sticky-notes')
          .set('Accept', 'application/json')
          .send({
            text: newStickyNote.text,
            pos: existingStickyNote.pos,
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

    describe('GET /customers/{customerId}/sticky-notes', function() {

      it('should return 200 and the resources', function(done) {

        request(server)
          .get('/api/v0/customers/' + existingCustomer._id + '/sticky-notes')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.be.instanceOf(Array).and.have.lengthOf(1);
            res.body[0]._id.should.be.eql(existingStickyNote._id.toString());

            done();
          });
      });
    });

    describe('GET /sticky-notes/{stickyNoteId}', function() {

      it('should return 200 and the resource', function(done) {

        request(server)
          .get('/api/v0/sticky-notes/' + existingStickyNote._id)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingStickyNote._id.toString());
            res.body.text.should.eql(existingStickyNote.text);
            res.body.pos.should.eql(existingStickyNote.pos);
            new Date(res.body.created_at).should
              .eql(existingStickyNote.created_at);
            new Date(res.body.updated_at).should
              .eql(existingStickyNote.updated_at);

            done();
          });
      });

      it('should return 404 if id in path is invalid', function(done) {

        request(server)
          .get('/api/v0/sticky-notes/000')
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
          .get('/api/v0/sticky-notes/000000000000000000000000')
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

    describe('PUT /sticky-notes/{stickyNoteId}', function() {

      var updatedStickyNote = {
        _id: existingStickyNote._id.toString(),
        text: 'updated note',
        pos: 88888,
      };

      it('should return 200 if successfully updated', function(done) {

        request(server)
          .put('/api/v0/sticky-notes/' + existingStickyNote._id)
          .set('Accept', 'application/json')
          .send(updatedStickyNote)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingStickyNote._id.toString());
            res.body.text.should.eql(updatedStickyNote.text);
            res.body.pos.should.eql(updatedStickyNote.pos);
            new Date(res.body.created_at).should
              .eql(existingStickyNote.created_at);
            new Date(res.body.updated_at).should.be
              .greaterThan(existingStickyNote.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter is missing', function(done) {

        request(server)
          .put('/api/v0/sticky-notes/' + existingStickyNote._id)
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
          .put('/api/v0/sticky-notes/' + existingStickyNote._id)
          .set('Accept', 'application/json')
          .send({
            _id: existingStickyNote._id.toString(),
            text: existingStickyNote.text,
            pos: 'not_a_number',
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

      it('should return 404 if id in path is invalid', function(done) {

        request(server)
          .put('/api/v0/sticky-notes/000')
          .set('Accept', 'application/json')
          .send(updatedStickyNote)
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
          .put('/api/v0/sticky-notes/000000000000000000000000')
          .set('Accept', 'application/json')
          .send({
            _id: '000000000000000000000000',
            text: existingStickyNote.text,
            pos: existingStickyNote.pos,
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

        // insert another sticky note to produce conflict
        Customer.findById(existingCustomer._id, function(err, customer) {
          if (err) throw err;
          if (!customer) throw 'Customer not found';
          var conflictingStickyNote = new StickyNote({
            text: updatedStickyNote.text,
            pos: updatedStickyNote.pos,
          });
          customer.sticky_notes.push(conflictingStickyNote);
          customer.save(function(err) {
            if (err) throw err;

            request(server)
              .put('/api/v0/sticky-notes/' + updatedStickyNote._id)
              .set('Accept', 'application/json')
              .send(updatedStickyNote)
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
      });
    });

    describe('PATCH /sticky-notes/{stickyNoteId}', function() {

      var updatePatch = {
        text: 'updated note',
        pos: 88888,
      };

      it('should return 200 if successfully updated', function(done) {

        request(server)
          .patch('/api/v0/sticky-notes/' + existingStickyNote._id)
          .set('Accept', 'application/merge-patch+json')
          .send(updatePatch)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingStickyNote._id.toString());
            res.body.text.should.eql(updatePatch.text);
            res.body.pos.should.eql(updatePatch.pos);
            new Date(res.body.created_at).should
              .eql(existingStickyNote.created_at);
            new Date(res.body.updated_at).should.be
              .greaterThan(existingStickyNote.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter has invalid value', function(done) {

        request(server)
          .patch('/api/v0/sticky-notes/' + existingStickyNote._id)
          .set('Accept', 'application/merge-patch+json')
          .send({
            text: updatePatch.text,
            pos: 'not_a_number',
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

      it('should return 404 if id in path is invalid', function(done) {

        request(server)
          .patch('/api/v0/sticky-notes/000')
          .set('Accept', 'application/merge-patch+json')
          .send(updatePatch)
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
          .patch('/api/v0/sticky-notes/000000000000000000000000')
          .set('Accept', 'application/merge-patch+json')
          .send(updatePatch)
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

        // insert another sticky note to produce conflict
        Customer.findById(existingCustomer._id, function(err, customer) {
          if (err) throw err;
          if (!customer) throw 'Customer not found';
          var conflictingStickyNote = new StickyNote({
            text: updatePatch.text,
            pos: updatePatch.pos,
          });
          customer.sticky_notes.push(conflictingStickyNote);
          customer.save(function(err) {
            if (err) throw err;

            request(server)
              .patch('/api/v0/sticky-notes/' + existingStickyNote._id)
              .set('Accept', 'application/json')
              .send(updatePatch)
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
      });
    });

    describe('DELETE /sticky-notes/{stickyNoteId}', function() {

      it('should return 204 if successful', function(done) {

        request(server)
          .delete('/api/v0/sticky-notes/' + existingStickyNote._id)
          .set('Accept', 'application/json')
          .expect(204)
          .end(function(err, res) {
            should.not.exist(err);

            done();
          });
      });

      it('should return 404 if id in path is invalid', function(done) {

        request(server)
          .delete('/api/v0/sticky-notes/000')
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
          .delete('/api/v0/sticky-notes/000000000000000000000000')
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
