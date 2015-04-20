/**
 * ParseRita
 *
 * An implementation of Resque for Parse Cloud Code
 *
 * Uses background jobs as workers, and Parse Data classes for storage
 *
 * Author: Fosco Marotto <fjm@fb.com>
 */

var ResqueQueue = Parse.Object.extend("ResqueQueue");
var ResqueLog = Parse.Object.extend("ResqueLog");

var jobs = [];
var queues = [];
var startTime;
var delayTime = 15000; // default 15s
var runTime = 14.5 * 60 * 1000; // default 14m30s

var setDelayOnEmptyQueue = function(timeInMs) {
  delayTime = timeInMs;
};

var setRunLimit = function(timeInMs) {
  runTime = timeInMs;
};

var job = function(jobName, func) {
  jobs[jobName] = func;
};

var enqueue = function(queue, jobName, scalarArgs, objectArgs) {
  if (!queue || !jobName) {
    return log(
      'Failed to queue invalid job, missing jobName or queue',
      {
        'queue' : queue,
        'jobName' : jobName,
        'scalarArgs' : (scalarArgs ? scalarArgs : []),
        'objectArgs' : (objectArgs ? objectArgs : [])
      }
    );
  }
  var job = new ResqueQueue();
  job.set('queue', queue);
  job.set('jobName', jobName);
  job.set('scalarArgs', scalarArgs);
  job.set('objectArgs', objectArgs);
  job.set('processed', 0);
  job.set('status', 'new');
  job.set('result', '');
  return job.save(null, { useMasterKey : true });
};

var worker = function(queuesParam) {
  startTime = Date.now();
  queues = queuesParam;
  if (!queues || !queues.length) {
    return log('Failed to start worker, queues not provided', []);
  }
  return log(
    'Worker started at ' + startTime,
    {
      'queues' : queues
    }
  ).then(poll);
};

var poll = function() {
  return Parse.Promise.as().then(timeLimitCheck).then(function() {
    var query = new Parse.Query(ResqueQueue);
    query.containedIn('queue', queues);
    query.equalTo('processed', 0);
    query.include('objectArgs');
    var jobCount = 0;
    return query.each(function(job) {
      var promise = new Parse.Promise();
      jobCount++;
      perform(job).then(function() {
        promise.resolve();
      }, function(err) {
        log(
          'Failed to perform job ' + job.id, { error: err }
        ).then(function() {
          promise.resolve();
        });
      });
      return promise;
    }).then(function() {
      if (jobCount) {
        return log(
          'Worker cycle completed after ' + jobCount + ' jobs processed',
          { jobCount : jobCount }
        );
      } else {
        return Parse.Promise.as();
      }
    });
  }).then(delay).then(poll);
};

var perform = function(job) {
  job.increment('processed');
  return job.save(null, { useMasterKey : true }).then(function(job) {
    var promise = new Parse.Promise();
    if (job.get('processed') != 1) {
      return promise.resolve();
    }
    var jobName = job.get('jobName');
    if (!jobs[jobName]) {
      return log(
        'Undefined jobName, ' + jobName,
        { job : job }
      ).then(function() {
        return job.save({
          status : 'error',
          result : 'Undefined jobName'
        }, { useMasterKey : true });
      }).then(function() {
        promise.resolve();
      });
    }
    var promise = new Parse.Promise();
    var scalarArgs = job.get('scalarArgs');
    var objectArgs = job.get('objectArgs');
    jobs[jobName](scalarArgs, objectArgs).then(function(result) {
      return job.save({
        'status' : 'completed',
        'result' : result.toString()
      }, { useMasterKey : true });
    }).then(timeLimitCheck).then(function() {
      promise.resolve();
    }, function(err) {
      promise.resolve();
    });
    return promise;
  });
};

var log = function(message, data) {
  var entry = new ResqueLog();
  entry.set('message', message);
  entry.set('data', data);
  return entry.save();
}


var delay = function() {
  var delayUntil = Date.now() + delayTime;
  var delayPromise = new Parse.Promise();

  var _delay = function () {
    if (Date.now() > delayUntil) {
      delayPromise.resolve();
      return;
    }
    process.nextTick(_delay);
  };
  _delay();

  return delayPromise;
};

function timeLimitCheck() {
  if (Date.now() > (startTime + runTime)) {
    return log(
      'Worker closing at end of time limit.', [startTime, runTime, Date.now()]
    ).then(terminate);
  }
  return Parse.Promise.as();
}

function terminate() {
  process.abort();
}

function createHandler(response) {
  /*
   * Default error handling behaviour for async requests
   */
  function errorHandler(result) {
    if (result && result.message) {
      var msg = 'Rita error: ' + result.message;
      console.error(msg);
      // afterSave doesnt have the response object available
      if (response) {
        response.error(msg);
      }
    }
  }
  return errorHandler;
}

module.exports = {
  job : job,
  enqueue : enqueue,
  worker : worker,
  setDelayOnEmptyQueue : setDelayOnEmptyQueue,
  setRunLimit : setRunLimit
};