var mongoose = require('mongoose');
var csv = require('fast-csv');

var models = require('../models');
mongoose.connect('mongodb://localhost/test');

module.exports.importFile = function(filePath, modelName) {
  csv
    .fromPath(filePath, {headers: true})
    .on('data', function(data) {

      var Obj = mongoose.model(modelName);

      var obj = new Obj();

      Object.keys(data).forEach(function(key) {
        var val = data[key];
        if (val.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
          // parse date
          var parts = val.split('/');
          val = new Date(parts[2], parts[1]-1, parts[0]);
        }

        if (val !== '')
          obj.set(key, val);
      });

      obj.save(function (err) {
        if (err)
          console.log(err);
      });
    })
    .on('end', function() {
      console.log("finished loading csv files");
    });
}