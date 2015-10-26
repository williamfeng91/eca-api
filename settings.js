var settings = {};

// server
settings.port = process.env.PORT || 10010;

// database
settings.db = 'mongodb://localhost/eca';

// log
settings.logDirectory = __dirname + '/logs';
settings.logLevel = 'debug';

module.exports = settings;