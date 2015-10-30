var should = require('should');
var request = require('supertest');
var mongoose = require('mongoose');
var constants = require('../../../api/helpers/constants');

var server = require('../../../app');
var models = require('../../../api/models');
var Customer = models.Customer;
var Checklist = models.Checklist;

describe('controllers', function() {

  describe('checklists', function() {

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

    var existingChecklist = new Checklist({
      name: 'existingChecklist',
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
        // empty the array and insert one checklist to be used by test cases
        customer.checklists = [];
        customer.checklists.push(existingChecklist);
        customer.save(function(err) {
          if (err) throw err;
          done();
        });
      });
    });

    describe('POST /customers/{customerId}/checklists', function() {

      var newChecklist = {
        name: 'new note',
      };

      it('should return 201 when inserting into empty database',
      function(done) {

        Customer.findById(existingCustomer._id, function(err, customer) {
          if (err) throw err;
          if (!customer) throw 'Customer not found';
          // empty the array
          customer.checklists = [];
          customer.save(function(err) {
            if (err) throw err;

            request(server)
              .post('/api/v0/customers/' + existingCustomer._id
                  + '/checklists')
              .set('Accept', 'application/json')
              .send(newChecklist)
              .expect('Content-Type', /json/)
              .expect(201)
              .end(function(err, res) {
                should.not.exist(err);

                res.body.should.have.property('_id');
                res.body.name.should.eql(newChecklist.name);
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
          .post('/api/v0/customers/' + existingCustomer._id + '/checklists')
          .set('Accept', 'application/json')
          .send(newChecklist)
          .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.have.property('_id');
            res.body.name.should.eql(newChecklist.name);
            res.body.pos.should.eql(
              existingChecklist.pos + constants.POS_AUTO_INCREMENT);
            res.body.should.have.property('created_at');
            res.body.should.have.property('updated_at');
            res.body.created_at.should.eql(res.body.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter is missing', function(done) {

        request(server)
          .post('/api/v0/customers/' + existingCustomer._id + '/checklists')
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
          .post('/api/v0/customers/' + existingCustomer._id + '/checklists')
          .set('Accept', 'application/json')
          .send({
            name: 'new note',
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
          .post('/api/v0/customers/000/checklists')
          .set('Accept', 'application/json')
          .send(newChecklist)
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
          .post('/api/v0/customers/000000000000000000000000/checklists')
          .set('Accept', 'application/json')
          .send(newChecklist)
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
          .post('/api/v0/customers/' + existingCustomer._id + '/checklists')
          .set('Accept', 'application/json')
          .send({
            name: newChecklist.name,
            pos: existingChecklist.pos,
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

    describe('GET /customers/{customerId}/checklists', function() {

      it('should return 200 and the resources', function(done) {

        request(server)
          .get('/api/v0/customers/' + existingCustomer._id + '/checklists')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.be.instanceOf(Array).and.have.lengthOf(1);
            res.body[0]._id.should.be.eql(existingChecklist._id.toString());

            done();
          });
      });
    });

    describe('GET /checklists/{checklistId}', function() {

      it('should return 200 and the resource', function(done) {

        request(server)
          .get('/api/v0/checklists/' + existingChecklist._id)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingChecklist._id.toString());
            res.body.name.should.eql(existingChecklist.name);
            res.body.pos.should.eql(existingChecklist.pos);
            new Date(res.body.created_at).should
              .eql(existingChecklist.created_at);
            new Date(res.body.updated_at).should
              .eql(existingChecklist.updated_at);

            done();
          });
      });

      it('should return 404 if id in path is invalid', function(done) {

        request(server)
          .get('/api/v0/checklists/000')
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
          .get('/api/v0/checklists/000000000000000000000000')
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

    describe('PUT /checklists/{checklistId}', function() {

      var updatedChecklist = {
        _id: existingChecklist._id.toString(),
        name: 'updated note',
        pos: 88888,
      };

      it('should return 200 if successfully updated', function(done) {

        request(server)
          .put('/api/v0/checklists/' + existingChecklist._id)
          .set('Accept', 'application/json')
          .send(updatedChecklist)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingChecklist._id.toString());
            res.body.name.should.eql(updatedChecklist.name);
            res.body.pos.should.eql(updatedChecklist.pos);
            new Date(res.body.created_at).should
              .eql(existingChecklist.created_at);
            new Date(res.body.updated_at).should.be
              .greaterThan(existingChecklist.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter is missing', function(done) {

        request(server)
          .put('/api/v0/checklists/' + existingChecklist._id)
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
          .put('/api/v0/checklists/' + existingChecklist._id)
          .set('Accept', 'application/json')
          .send({
            _id: existingChecklist._id.toString(),
            name: existingChecklist.name,
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
          .put('/api/v0/checklists/000')
          .set('Accept', 'application/json')
          .send(updatedChecklist)
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
          .put('/api/v0/checklists/000000000000000000000000')
          .set('Accept', 'application/json')
          .send({
            _id: '000000000000000000000000',
            name: existingChecklist.name,
            pos: existingChecklist.pos,
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

        // insert another checklist to produce conflict
        Customer.findById(existingCustomer._id, function(err, customer) {
          if (err) throw err;
          if (!customer) throw 'Customer not found';
          var conflictingChecklist = new Checklist({
            name: updatedChecklist.name,
            pos: updatedChecklist.pos,
          });
          customer.checklists.push(conflictingChecklist);
          customer.save(function(err) {
            if (err) throw err;

            request(server)
              .put('/api/v0/checklists/' + updatedChecklist._id)
              .set('Accept', 'application/json')
              .send(updatedChecklist)
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

    describe('PATCH /checklists/{checklistId}', function() {

      var updatePatch = {
        name: 'updated note',
        pos: 88888,
      };

      it('should return 200 if successfully updated', function(done) {

        request(server)
          .patch('/api/v0/checklists/' + existingChecklist._id)
          .set('Accept', 'application/json')
          .send(updatePatch)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingChecklist._id.toString());
            res.body.name.should.eql(updatePatch.name);
            res.body.pos.should.eql(updatePatch.pos);
            new Date(res.body.created_at).should
              .eql(existingChecklist.created_at);
            new Date(res.body.updated_at).should.be
              .greaterThan(existingChecklist.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter has invalid value', function(done) {

        request(server)
          .patch('/api/v0/checklists/' + existingChecklist._id)
          .set('Accept', 'application/json')
          .send({
            name: updatePatch.name,
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
          .patch('/api/v0/checklists/000')
          .set('Accept', 'application/json')
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
          .patch('/api/v0/checklists/000000000000000000000000')
          .set('Accept', 'application/json')
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

        // insert another checklist to produce conflict
        Customer.findById(existingCustomer._id, function(err, customer) {
          if (err) throw err;
          if (!customer) throw 'Customer not found';
          var conflictingChecklist = new Checklist({
            name: updatePatch.name,
            pos: updatePatch.pos,
          });
          customer.checklists.push(conflictingChecklist);
          customer.save(function(err) {
            if (err) throw err;

            request(server)
              .patch('/api/v0/checklists/' + existingChecklist._id)
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

    describe('DELETE /checklists/{checklistId}', function() {

      it('should return 204 if successful', function(done) {

        request(server)
          .delete('/api/v0/checklists/' + existingChecklist._id)
          .set('Accept', 'application/json')
          .expect(204)
          .end(function(err, res) {
            should.not.exist(err);

            done();
          });
      });

      it('should return 404 if id in path is invalid', function(done) {

        request(server)
          .delete('/api/v0/checklists/000')
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
          .delete('/api/v0/checklists/000000000000000000000000')
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
