'use strict';

var SwaggerExpress = require('swagger-express-mw');
var SwaggerUi = require('swagger-tools/middleware/swagger-ui');
var mongoose = require('mongoose');
var boom = require('boom');
var FileStreamRotator = require('file-stream-rotator');
var fs = require('fs');
var morgan = require('morgan');
var winston = require('winston');

var environment = process.env.NODE_ENV;
var settings;
if (environment == 'production') {
    settings = require('./settings');
} else {
    settings = require('./settings_dev');
}
var db = mongoose.connect(settings.db);
var app = require('express')();
module.exports = app; // for testing

var config = {
    appRoot: __dirname // required config
};

// ensure log directory exists
fs.existsSync(settings.logDirectory) || fs.mkdirSync(settings.logDirectory);

// set up access log
var accessLogStream = FileStreamRotator.getStream({
    filename: settings.logDirectory + '/access.log.%DATE%',
    frequency: 'daily',
    verbose: false,
    date_format: 'YYYYMMDD'
});
app.use(morgan('combined', {stream: accessLogStream}));

// set up error log
var logger = new winston.Logger({
    transports: [
        new(winston.transports.DailyRotateFile)({
            filename: settings.logDirectory + '/eca.log',
            datePattern: '.yyyyMMdd',
            level: settings.logLevel
        }),
        // new winston.transports.Console({
        //     level: 'debug',
        //     handleExceptions: true,
        //     json: false,
        //     colorize: true
        // })
    ],
    exitOnError: false
});

SwaggerExpress.create(config, function(err, swaggerExpress) {
    if (err) { throw err; }

    // Add swagger-ui (This must be before swaggerExpress.register)
    app.use(SwaggerUi(swaggerExpress.runner.swagger));

    // install middleware
    swaggerExpress.register(app);

    // Error handling
    app.use(function(err, req, res, next) {
        logger.error('Handling error: ' + err);
        var error;
        if (typeof err !== 'object') {
            error = new boom.badImplementation();
        } else if (err.isBoom) {
            // pass on boom error
            error = err;
        } else if (err.failedValidation) {
            // schema validation error
            error = new boom.badRequest('Input validation failed');
            error.output.payload.details = err;
        } else {
            error = new boom.badImplementation();
        }
        res.setHeader('Content-Type', 'application/json');
        // res.json(err);
        res.status(error.output.statusCode).json(error.output.payload);
    });

    var port = settings.port;
    app.listen(port);
});