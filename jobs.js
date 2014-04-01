var resque = require('cloud/parse-resque');

resque.addJob('hello', function(scalarArgs, objectArgs) {
  console.log('Hello!');
  return Parse.Promise.as('Hi!');
});

resque.addJob('add', function(scalarArgs, objectArgs) {
  var sum = scalarArgs[0] + scalarArgs[1];
  return Parse.Promise.as(sum);
});

resque.addJob('updateCount', function(scalarArgs, objectArgs) {
  var object = objectArgs[0];
  var field = scalarArgs[0];
  var amount = scalarArgs[1];
  object.increment(field, amount);
  return object.save();
});