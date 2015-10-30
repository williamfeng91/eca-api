var should = require('should');
var request = require('supertest');
var mongoose = require('mongoose');
var constants = require('../../../api/helpers/constants');

var server = require('../../../app');
var models = require('../../../api/models');
var Customer = models.Customer;
var Checklist = models.Checklist;
var ChecklistItem = models.ChecklistItem;

describe('controllers', function() {

  describe('checklistItems', function() {

    var existingChecklist = new Checklist({
      name: 'existingChecklist',
      pos: 99999,
      created_at: new Date(),
      updated_at: new Date(),
    });

    var existingCustomer = new Customer({
      email: 'a@b.com',
      surname: 'Smith',
      given_name: 'John',
      gender: 'male',
      status: mongoose.Types.ObjectId(),
      list_pos: 99999,
      workflow_pos: 99999,
      is_archived: false,
      checklists: [existingChecklist],
      created_at: new Date(),
      updated_at: new Date(),
    });

    var existingChecklistItem = new ChecklistItem({
      text: 'existingChecklistItem',
      checked: true,
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
      Customer.findOne({'checklists._id': existingChecklist._id},
      function(err, customer) {
        if (err) throw err;
        if (!customer) throw 'Customer not found';
        // empty the array and insert one checklistItem to be used by test cases
        var checklist = customer.checklists.id(existingChecklist._id);
        checklist.items = [];
        checklist.items.push(existingChecklistItem);
        customer.save(function(err) {
          if (err) throw err;
          done();
        });
      });
    });

    describe('POST /checklists/{checklistId}/checklist-items', function() {

      var newChecklistItem = {
        text: 'new item',
        checked: true,
      };

      it('should return 201 when inserting into empty database',
      function(done) {

        Customer.findOne({'checklists._id': existingChecklist._id},
        function(err, customer) {
          if (err) throw err;
          if (!customer) throw 'Customer not found';
          // empty the array
          var checklist = customer.checklists.id(existingChecklist._id);
          checklist.items = [];
          customer.save(function(err) {
            if (err) throw err;

            request(server)
              .post('/api/v0/checklists/' + existingChecklist._id
                  + '/checklist-items')
              .set('Accept', 'application/json')
              .send(newChecklistItem)
              .expect('Content-Type', /json/)
              .expect(201)
              .end(function(err, res) {
                should.not.exist(err);

                res.body.should.have.property('_id');
                res.body.text.should.eql(newChecklistItem.text);
                res.body.checked.should.eql(newChecklistItem.checked);
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
          .post('/api/v0/checklists/' + existingChecklist._id + '/checklist-items')
          .set('Accept', 'application/json')
          .send(newChecklistItem)
          .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.have.property('_id');
            res.body.text.should.eql(newChecklistItem.text);
            res.body.checked.should.eql(newChecklistItem.checked);
            res.body.pos.should.eql(
              existingChecklistItem.pos + constants.POS_AUTO_INCREMENT);
            res.body.should.have.property('created_at');
            res.body.should.have.property('updated_at');
            res.body.created_at.should.eql(res.body.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter is missing', function(done) {

        request(server)
          .post('/api/v0/checklists/' + existingChecklist._id + '/checklist-items')
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
          .post('/api/v0/checklists/' + existingChecklist._id + '/checklist-items')
          .set('Accept', 'application/json')
          .send({
            text: newChecklistItem.text,
            checked: newChecklistItem.checked,
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
          .post('/api/v0/checklists/000/checklist-items')
          .set('Accept', 'application/json')
          .send(newChecklistItem)
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
          .post('/api/v0/checklists/000000000000000000000000/checklist-items')
          .set('Accept', 'application/json')
          .send(newChecklistItem)
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
          .post('/api/v0/checklists/' + existingChecklist._id + '/checklist-items')
          .set('Accept', 'application/json')
          .send({
            text: newChecklistItem.text,
            checked: newChecklistItem.checked,
            pos: existingChecklistItem.pos,
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

    describe('GET /checklists/{checklistId}/checklist-items', function() {

      it('should return 200 and the resources', function(done) {

        request(server)
          .get('/api/v0/checklists/' + existingChecklist._id + '/checklist-items')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.be.instanceOf(Array).and.have.lengthOf(1);
            res.body[0]._id.should.be.eql(existingChecklistItem._id.toString());

            done();
          });
      });
    });

    describe('GET /checklists/{checklistId}/checklist-items/{checklistItemId}', function() {

      it('should return 200 and the resource', function(done) {

        request(server)
          .get('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/' + existingChecklistItem._id)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingChecklistItem._id.toString());
            res.body.text.should.eql(existingChecklistItem.text);
            res.body.checked.should.eql(existingChecklistItem.checked);
            res.body.pos.should.eql(existingChecklistItem.pos);
            new Date(res.body.created_at).should
              .eql(existingChecklistItem.created_at);
            new Date(res.body.updated_at).should
              .eql(existingChecklistItem.updated_at);

            done();
          });
      });

      it('should return 404 if id in path is invalid', function(done) {

        request(server)
          .get('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/000')
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
          .get('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/000000000000000000000000')
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

    describe('PUT /checklists/{checklistId}/checklist-items/{checklistItemId}', function() {

      var updatedChecklistItem = {
        _id: existingChecklistItem._id.toString(),
        text: 'updated item',
        checked: false,
        pos: 88888,
      };

      it('should return 200 if successfully updated', function(done) {

        request(server)
          .put('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/' + existingChecklistItem._id)
          .set('Accept', 'application/json')
          .send(updatedChecklistItem)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingChecklistItem._id.toString());
            res.body.text.should.eql(updatedChecklistItem.text);
            res.body.checked.should.eql(updatedChecklistItem.checked);
            res.body.pos.should.eql(updatedChecklistItem.pos);
            new Date(res.body.created_at).should
              .eql(existingChecklistItem.created_at);
            new Date(res.body.updated_at).should.be
              .greaterThan(existingChecklistItem.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter is missing', function(done) {

        request(server)
          .put('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/' + existingChecklistItem._id)
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
          .put('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/' + existingChecklistItem._id)
          .set('Accept', 'application/json')
          .send({
            _id: existingChecklistItem._id.toString(),
            text: existingChecklistItem.text,
            checked: existingChecklistItem.checked,
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
          .put('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/000')
          .set('Accept', 'application/json')
          .send(updatedChecklistItem)
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
          .put('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/000000000000000000000000')
          .set('Accept', 'application/json')
          .send({
            _id: '000000000000000000000000',
            text: existingChecklistItem.text,
            checked: existingChecklistItem.checked,
            pos: existingChecklistItem.pos,
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

        // insert another checklistItem to produce conflict
        Customer.findOne({'checklists._id': existingChecklist._id},
        function(err, customer) {
          if (err) throw err;
          if (!customer) throw 'Customer not found';
          var checklist = customer.checklists.id(existingChecklist._id);
          var conflictingChecklistItem = new ChecklistItem({
            text: updatedChecklistItem.text,
            checked: updatedChecklistItem.checked,
            pos: updatedChecklistItem.pos,
          });
          checklist.items.push(conflictingChecklistItem);
          customer.save(function(err) {
            if (err) throw err;

            request(server)
              .put('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/' + updatedChecklistItem._id)
              .set('Accept', 'application/json')
              .send(updatedChecklistItem)
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

    describe('PATCH /checklists/{checklistId}/checklist-items/{checklistItemId}', function() {

      var updatePatch = {
        text: 'updated item',
        pos: 88888,
      };

      it('should return 200 if successfully updated', function(done) {

        request(server)
          .patch('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/' + existingChecklistItem._id)
          .set('Accept', 'application/json')
          .send(updatePatch)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body._id.should.eql(existingChecklistItem._id.toString());
            res.body.text.should.eql(updatePatch.text);
            res.body.pos.should.eql(updatePatch.pos);
            new Date(res.body.created_at).should
              .eql(existingChecklistItem.created_at);
            new Date(res.body.updated_at).should.be
              .greaterThan(existingChecklistItem.updated_at);

            done();
          });
      });

      it('should return 400 if a parameter has invalid value', function(done) {

        request(server)
          .patch('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/' + existingChecklistItem._id)
          .set('Accept', 'application/json')
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
          .patch('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/000')
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
          .patch('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/000000000000000000000000')
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

        // insert another checklistItem to produce conflict
        Customer.findOne({'checklists._id': existingChecklist._id},
        function(err, customer) {
          if (err) throw err;
          if (!customer) throw 'Customer not found';
          var checklist = customer.checklists.id(existingChecklist._id);
          var conflictingChecklistItem = new ChecklistItem({
            text: updatePatch.text,
            checked: existingChecklistItem.checked,
            pos: updatePatch.pos,
          });
          checklist.items.push(conflictingChecklistItem);
          customer.save(function(err) {
            if (err) throw err;

            request(server)
              .patch('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/' + existingChecklistItem._id)
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

    describe('DELETE /checklists/{checklistId}/checklist-items/{checklistItemId}', function() {

      it('should return 204 if successful', function(done) {

        request(server)
          .delete('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/' + existingChecklistItem._id)
          .set('Accept', 'application/json')
          .expect(204)
          .end(function(err, res) {
            should.not.exist(err);

            done();
          });
      });

      it('should return 404 if id in path is invalid', function(done) {

        request(server)
          .delete('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/000')
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
          .delete('/api/v0/checklists/' + existingChecklist._id + '/checklist-items/000000000000000000000000')
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
