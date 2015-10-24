'use strict';

var SwaggerExpress = require('swagger-express-mw');
var SwaggerUi = require('swagger-tools/middleware/swagger-ui');
var mongoose = require('mongoose');
var boom = require('boom');

var db = mongoose.connect('mongodb://localhost/eca');
var app = require('express')();
module.exports = app; // for testing

var config = {
    appRoot: __dirname // required config
};

SwaggerExpress.create(config, function(err, swaggerExpress) {
    if (err) { throw err; }

    // Add swagger-ui (This must be before swaggerExpress.register)
    app.use(SwaggerUi(swaggerExpress.runner.swagger));

    // install middleware
    swaggerExpress.register(app);

    // Error handling
    app.use(function(err, req, res, next) {
        console.error('Handling error: ' + err);
        var error;
        if (typeof err !== 'object') {
            error = new boom.badImplementation();
        } else if (err.isBoom) {
            // pass on boom error
            error = err;
        } else if (err.code == 'SCHEMA_VALIDATION_FAILED') {
            // schema validation error
            error = new boom.badRequest('Input validation failed');
            error.output.payload.details = err.results.errors;
        } else {
            error = new boom.badImplementation();
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(error.output.statusCode).json(error.output.payload);
    });

    var port = process.env.PORT || 10010;
    app.listen(port);
});