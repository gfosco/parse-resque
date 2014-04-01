### ParseRita

Rita, the Parse Cloud Code job assistant.  She defines, queues, and processes work on a constant basis.

#### USAGE

First, you'll want to define some jobs:

```javascript
var rita = require('cloud/parse-rita');

rita.job('hello', function(scalarArgs, objectArgs) {
  return Parse.Promise.as('Hi!');
});

rita.job('add', function(scalarArgs, objectArgs) {
  var sum = scalarArgs[0] + scalarArgs[1];
  return Parse.Promise.as(sum);
});

rita.job('updateCount', function(scalarArgs, objectArgs) {
  var object = objectArgs[0];
  var field = scalarArgs[0];
  var amount = scalarArgs[1];
  object.increment(field, amount);
  object.save();
});
```

Then, queue up a few jobs, providing a queue name, job name, an array of scalar arguments, and an array of Parse Objects.  These arguments will be available to the job, and the passed in Parse Objects will be included.

```javascript
var rita = require('cloud/parse-rita');

rita.enqueue('test', 'hello');
rita.enqueue('test', 'add', [1,2]);
rita.enqueue('test', 'updateCount', ['countField', 1], [object]);
```

Next, define a Background Job that will run your worker:

```javascript
Parse.Cloud.job('testworker', function(request, status) {
  rita.worker(['test']);
});
```

By default, this will process jobs for 4 minutes and 30 seconds and pause for 15 seconds after clearing the job queue.  You can alter the defaults with values in milliseconds:

```javascript
rita.setDelayOnEmptyQueue(15000);
rita.setRunLimit(4.5 * 60 * 1000);
```

With this module you can attain a finer granularity than simpler job systems running at every-minute intervals.