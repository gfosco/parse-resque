# ParseResque

Parse.com Cloud Code port of Resque.

## USAGE

First, you'll want to configure some jobs:

```javascript
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
```

Then, queue up a few jobs:

```javascript
var resque = require('cloud/parse-resque');

resque.enqueue('test', 'hello');
resque.enqueue('test', 'add', [1,2]);
resque.enqueue('test', 'updateCount', ['countField', 1], [object]);
```

Next, you'll want to setup a worker to handle these jobs,
using a Background Job in Parse Cloud Code:

```javascript
Parse.Cloud.job('testworker', function(request, status) {
  resque.worker(['test']);
});
```

Schedule the background job to run every minute.  Background jobs have a time
 limit of 15 minutes.  This implementation will run for approximately 14
 minutes 30 seconds by default, leaving very little time between the end of
 one run and the start of the next one.

You can alter the defaults with values in milliseconds:

```javascript
resque.setDelayOnEmptyQueue(15000);
resque.setRunLimit(14.5 * 60 * 1000);
```

Feel free to submit pull requests, issues, or get in touch with me at fjm@fb.com