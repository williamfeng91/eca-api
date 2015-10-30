var models = [
  'customer',
  'workflowStatus',
  'checklist',
  'checklistItem',
  'stickyNote'
];

for (var i in models) {
  exports[capitalizeFirstLetter(models[i])]
    = require('./' + models[i] + 'Model');
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}