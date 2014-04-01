
var resque = require('cloud/parse-resque');

require('cloud/jobs');

Parse.Cloud.define('makeTestData', function(req, res) {

  var obj = new Parse.Object('TestObject');
  obj.set('count', 1);
  obj.save().then(function(obj) {
    promises = [];
    promises.push(resque.enqueue('test', 'hello'));
    promises.push(resque.enqueue('test', 'add', [1,2]));
    promises.push(resque.enqueue('test', 'updateCount', ['count', 1], [obj]));
    return Parse.Promise.when(promises);
  }).then(function() {
    res.success();
  }, function(err) {
    res.error();
  });

});

Parse.Cloud.job('workertest1', function(request, status) {
  resque.worker(request.params.queues);
});
