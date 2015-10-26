var should = require('should');
var request = require('supertest');
var mongoose = require('mongoose');

var server = require('../../../app');

describe('controllers', function() {

  describe('workflowStatuses', function() {

    before(function(done) {
      mongoose.connection.collections['workflowstatuses'].drop(function(err) {
        done();
      });
    });

    describe('POST /workflow-statuses', function() {

      it('should return 201 and the resource if successfully created', function(done) {

        request(server)
          .post('/api/v0/workflow-statuses')
          .set('Accept', 'application/json')
          .send({
            name: 'testStatus',
            color: 'green'
          })
          .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.have.property('_id');
            res.body.name.should.eql('testStatus');
            res.body.color.should.eql('green');
            res.body.should.have.property('created_at');
            res.body.should.have.property('updated_at');
            res.body.created_at.should.eql(res.body.updated_at);

            done();
          });
      });

      it('should return 400 if parameter is missing', function(done) {

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
            res.body.message.should.eql('Input validation failed');

            done();
          });
      });

      it('should return 400 if parameter has invalid value', function(done) {

        request(server)
          .post('/api/v0/workflow-statuses')
          .set('Accept', 'application/json')
          .send({
            name: 'testStatus',
            color: 'not_a_color'
          })
          .expect('Content-Type', /json/)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.statusCode.should.eql(400);
            res.body.error.should.eql('Bad Request');
            res.body.message.should.eql('Input validation failed');

            done();
          });
      });

    });

  });

});
