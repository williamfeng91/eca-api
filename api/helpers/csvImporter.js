var csv = require('./csvImport');

csv.importFile(__dirname + '/../../db/statuses.csv', 'WorkflowStatus');
// csv.importFile(__dirname + '/../../db/customers.csv', 'Customer');
