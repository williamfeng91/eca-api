var should = require('should');
var request = require('supertest');
var mongoose = require('mongoose');
var constants = require('../../../api/helpers/constants');

var server = require('../../../app');
var models = require('../../../api/models');
var Customer = models.Customer;
var WorkflowStatus = models.WorkflowStatus;

describe('controllers', function() {

  describe('customers', function() {

    var existingStatus = new WorkflowStatus({
      name: 'existingStatus',
      color: 'red',
      pos: 99999,
    });

    var existingCustomer = new Customer({
      email: 'william.feng91@gmail.com',
      surname: 'Feng',
      given_name: 'Yunchao',
      nickname: 'William',
      real_name: '冯云超',
      gender: 'male',
      birthday: new Date(),
      mobile: '0412345678',
      qq: '88888888',
      wechat: '88888888',
      au_address: '1 George St, Sydney 2000',
      foreign_address: '上海市',
      visa_expiry_date: new Date(),
      status: existingStatus._id,
      list_pos: 99999,
      workflow_pos: 99999,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    before(function(done) {
      // empty the collection before test
      WorkflowStatus.remove(function(err) {
        if (err) throw err;
        // insert one workflow status to be used by test cases
        existingStatus.save(function(err, workflowStatus) {
          if (err) throw err;
          if (!workflowStatus) throw 'Workflow status not found';
          done();
        });
      });
    });

    beforeEach(function(done) {
      // empty the collection before test
      Customer.remove(function(err) {
        if (err) throw err;
        // insert one customer to be used by test cases
        var newCustomer = new Customer(existingCustomer);
        newCustomer.save(function(err, customer) {
          if (err) throw err;
          done();
        });
      });
    });

    describe('POST /customers', function() {

      var newCustomer = {
        email: 'john.smith@hotmail.com',
        surname: 'John',
        given_name: 'John',
        gender: 'male',
        status: existingCustomer.status,
      };

      it('should return 201 when inserting into empty database',
      function(done) {

        // empty the collection
        Customer.remove(function(err) {
          if (err) throw err;

          request(server)
            .post('/api/v0/customers')
            .set('Accept', 'application/json')
            .send(newCustomer)
            .expect('Content-Type', /json/)
            .expect(201)
            .end(function(err, res) {
              should.not.exist(err);

              res.body.should.have.property('_id');
              res.body.email.should.eql(newCustomer.email);
              res.body.surname.should.eql(newCustomer.surname);
              res.body.given_name.should.eql(newCustomer.given_name);
              res.body.gender.should.eql(newCustomer.gender);
              res.body.list_pos.should.eql(constants.POS_START_VAL);
              res.body.workflow_pos.should.eql(constants.POS_START_VAL);
              res.body.should.have.property('created_at');
              res.body.should.have.property('updated_at');
              res.body.created_at.should.eql(res.body.updated_at);

              done();
            });
        });
      });

      it('should return 201 when inserting into database with existing data',
      function(done) {

        request(server)
          .post('/api/v0/customers')
          .set('Accept', 'application/json')
          .send(newCustomer)
          .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.have.property('_id');
            res.body.email.should.eql(newCustomer.email);
            res.body.surname.should.eql(newCustomer.surname);
            res.body.given_name.should.eql(newCustomer.given_name);
            res.body.gender.should.eql(newCustomer.gender);
            res.body.list_pos.should.eql(
              existingCustomer.list_pos + constants.POS_AUTO_INCREMENT);
            res.body.workflow_pos.should.eql(
              existingCustomer.workflow_pos + constants.POS_AUTO_INCREMENT);
            res.body.should.have.property('created_at');
            res.body.should.have.property('updated_at');
            res.body.created_at.should.eql(res.body.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter is missing', function(done) {

        request(server)
          .post('/api/v0/customers')
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
          .post('/api/v0/customers')
          .set('Accept', 'application/json')
          .send({
            email: 'not_an_email',
            surname: newCustomer.surname,
            given_name: newCustomer.given_name,
            gender: 'not_a_gender',
            status: newCustomer.status,
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
          .post('/api/v0/customers')
          .set('Accept', 'application/json')
          .send({
            email: newCustomer.email,
            surname: newCustomer.surname,
            given_name: newCustomer.given_name,
            gender: newCustomer.gender,
            status: newCustomer.status,
            list_pos: existingCustomer.list_pos,
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

    describe('GET /customers', function() {

      it('should return 200 and the resources', function(done) {

        request(server)
          .get('/api/v0/customers')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.be.instanceOf(Array).and.have.lengthOf(1);
            res.body[0]._id.should.be.eql(existingCustomer._id.toString());

            done();
          });
      });
    });

    describe('GET /customers/{customerId}', function() {

      it('should return 200 and the resource', function(done) {

        request(server)
          .get('/api/v0/customers/' + existingCustomer._id)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingCustomer._id.toString());
            res.body.email.should.eql(existingCustomer.email);
            res.body.surname.should.eql(existingCustomer.surname);
            res.body.given_name.should.eql(existingCustomer.given_name);
            res.body.gender.should.eql(existingCustomer.gender);
            res.body.list_pos.should.eql(existingCustomer.list_pos);
            res.body.workflow_pos.should.eql(existingCustomer.workflow_pos);
            new Date(res.body.created_at).should
              .eql(existingCustomer.created_at);
            new Date(res.body.updated_at).should
              .eql(existingCustomer.updated_at);

            done();
          });
      });

      it('should return 404 if id in path is invalid', function(done) {

        request(server)
          .get('/api/v0/customers/000')
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
          .get('/api/v0/customers/000000000000000000000000')
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

    describe('PUT /customers/{customerId}', function() {

      var updatedCustomer = {
        _id: existingCustomer._id.toString(),
        email: 'alice.bob@163.com',
        surname: 'Bob',
        given_name: 'Alice',
        gender: 'female',
        status: existingCustomer.status.toString(),
        list_pos: 88888,
        workflow_pos: 88888,
        is_archived: false,
      };

      it('should return 200 and the updated resource', function(done) {

        request(server)
          .put('/api/v0/customers/' + updatedCustomer._id)
          .set('Accept', 'application/json')
          .send(updatedCustomer)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingCustomer._id.toString());
            res.body.email.should.eql(updatedCustomer.email);
            res.body.surname.should.eql(updatedCustomer.surname);
            res.body.given_name.should.eql(updatedCustomer.given_name);
            res.body.gender.should.eql(updatedCustomer.gender);
            res.body.status.should.eql(updatedCustomer.status.toString());
            res.body.list_pos.should.eql(updatedCustomer.list_pos);
            res.body.workflow_pos.should.eql(updatedCustomer.workflow_pos);
            new Date(res.body.created_at).should
              .eql(existingCustomer.created_at);
            new Date(res.body.updated_at).should.be
              .greaterThan(existingCustomer.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter is missing', function(done) {

        request(server)
          .put('/api/v0/customers/' + existingCustomer._id)
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
          .put('/api/v0/customers/' + existingCustomer._id)
          .set('Accept', 'application/json')
          .send({
            _id: updatedCustomer._id,
            email: 'not_an_email',
            surname: updatedCustomer.surname,
            given_name: updatedCustomer.given_name,
            gender: updatedCustomer.gender,
            status: updatedCustomer.status,
            list_pos: updatedCustomer.list_pos,
            workflow_pos: updatedCustomer.workflow_pos,
            is_archived: updatedCustomer.is_archived,
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
          .put('/api/v0/customers/000')
          .set('Accept', 'application/json')
          .send(updatedCustomer)
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
          .put('/api/v0/customers/000000000000000000000000')
          .set('Accept', 'application/json')
          .send({
            _id: '000000000000000000000000',
            email: updatedCustomer.email,
            surname: updatedCustomer.surname,
            given_name: updatedCustomer.given_name,
            gender: updatedCustomer.gender,
            status: updatedCustomer.status,
            list_pos: updatedCustomer.list_pos,
            workflow_pos: updatedCustomer.workflow_pos,
            is_archived: updatedCustomer.is_archived,
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

        // insert another customer to produce conflict
        var conflictingCustomer = new Customer({
          email: updatedCustomer.email,
          surname: updatedCustomer.surname,
          given_name: updatedCustomer.given_name,
          gender: updatedCustomer.gender,
          status: updatedCustomer.status,
          list_pos: updatedCustomer.list_pos,
          workflow_pos: updatedCustomer.workflow_pos,
          is_archived: updatedCustomer.is_archived,
        });
        conflictingCustomer.save(function(err) {
          if (err) throw err;

          request(server)
            .put('/api/v0/customers/' + updatedCustomer._id)
            .set('Accept', 'application/json')
            .send(updatedCustomer)
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

    describe('PATCH /customers/{customerId}', function() {

      var updatePatch = {
        given_name: 'Alice',
        gender: 'female',
        list_pos: 88888,
      };

      it('should return 200 and the updated resource', function(done) {

        request(server)
          .patch('/api/v0/customers/' + existingCustomer._id)
          .set('Accept', 'application/json')
          .send(updatePatch)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingCustomer._id.toString());
            res.body.given_name.should.eql(updatePatch.given_name);
            res.body.gender.should.eql(updatePatch.gender);
            res.body.list_pos.should.eql(updatePatch.list_pos);
            new Date(res.body.created_at).should
              .eql(existingCustomer.created_at);
            new Date(res.body.updated_at).should.be
              .greaterThan(existingCustomer.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter has invalid value', function(done) {

        request(server)
          .patch('/api/v0/customers/' + existingCustomer._id)
          .set('Accept', 'application/json')
          .send({
            email: 'not_an_email',
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
          .patch('/api/v0/customers/000')
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
          .patch('/api/v0/customers/000000000000000000000000')
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

        // insert another customer to produce conflict
        var conflictingCustomer = new Customer({
          email: existingCustomer.email,
          surname: existingCustomer.surname,
          given_name: updatePatch.given_name,
          gender: updatePatch.gender,
          status: existingCustomer.status,
          list_pos: updatePatch.list_pos,
          workflow_pos: existingCustomer.workflow_pos + 1,
          is_archived: existingCustomer.is_archived,
        });
        conflictingCustomer.save(function(err) {
          if (err) throw err;

          request(server)
            .patch('/api/v0/customers/' + existingCustomer._id)
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

    describe('DELETE /customers/{customerId}', function() {

      it('should return 204', function(done) {

        request(server)
          .delete('/api/v0/customers/' + existingCustomer._id)
          .set('Accept', 'application/json')
          .expect(204)
          .end(function(err, res) {
            should.not.exist(err);

            done();
          });
      });

      it('should return 404 if id in path is invalid', function(done) {

        request(server)
          .delete('/api/v0/customers/000')
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
          .delete('/api/v0/customers/000000000000000000000000')
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
