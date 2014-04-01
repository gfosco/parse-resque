
var rita = require('cloud/parse-rita');

require('cloud/jobs');

Parse.Cloud.define('makeTestData', function(req, res) {

  var obj = new Parse.Object('TestObject');
  obj.set('count', 1);
  obj.save().then(function(obj) {
    promises = [];
    promises.push(rita.enqueue('test', 'hello'));
    promises.push(rita.enqueue('test', 'add', [1,2]));
    promises.push(rita.enqueue('test', 'updateCount', ['count', 1], [obj]));
    return Parse.Promise.when(promises);
  }).then(function() {
    res.success();
  }, function(err) {
    res.error();
  });

});

Parse.Cloud.job('workertest1', function(request, status) {
  rita.worker(request.params.queues);
});
