// Curried functions make this a lot simpler
//
function curryWith(params, expectedCount, f) {
  if (params.length === expectedCount) {
    return f.apply(this, params);
  } else {
    return function(a) {
      var newParams = params.concat([a]);
      return curryWith.apply(this, [newParams, expectedCount, f]);
    };
  }
};

function curry(f) {
  return curryWith.apply(this, [[], f.length, f]);
};

// We'll just add some number with our applicatives
//
var add = curry(function(x,y) { return x + y; });

console.log("-- Array Applicative --")

Array.pure = function(a) { return [a]; };
Array.prototype.applic = function (as) {
  var results = [];

  for (var i = 0; i < this.length; i++) {
    for (var j = 0; j < as.length; j++) {
      results.push(this[i](as[j]));
    };
  };

  return results;
};

console.log(
  Array.pure(add)
       .applic([1,2])
       .applic([2,3])
    );



console.log("-- Maybe Applicative --")

function Maybe(x) {
  this.value = x;
}

Maybe.Nothing = new Maybe(undefined);
Maybe.pure = function(a) { return new Maybe(a); };
Maybe.prototype.applic = function(a) {
  if (this.value !== undefined && a.value !== undefined) {
    return new Maybe(this.value(a.value));
  } else {
    return Maybe.Nothing
  }
};

Array.pure = function(a) { return [a]; };
Array.prototype.applic = function (as) {
  var results = [];

  for (var i = 0; i < this.length; i++) {
    for (var j = 0; j < as.length; j++) {
      results.push(this[i](as[j]));
    };
  };

  return results;
};

console.log(
  Maybe.pure(add)
       .applic(new Maybe(1))
       .applic(new Maybe(2))
    );

console.log(
  Maybe.pure(add)
       .applic(Maybe.Nothing)
       .applic(new Maybe(2))
    );

console.log(
  Maybe.pure(add)
       .applic(new Maybe(1))
       .applic(Maybe.Nothing)
    );

console.log("-- Async Applicative --");

function Async(run) {
  this.run = run;
};

Async.pure = function(a) {
  return new Async(function(cb) { cb(a); });
};

Async.prototype.applic = function(asyncA) {
  var asyncF = this;

  return new Async(function(cb) {
    var f = undefined;
    var a = undefined;
    var fDone = false;
    var aDone = false;

    asyncF.run(function(syncF) {
      if (aDone) {
        cb(syncF(a));
      } else {
        f = syncF;
        fDone = true;
      };
    });

    asyncA.run(function(syncA) {
      if (fDone) {
        cb(f(syncA));
      } else {
        a = syncA;
        aDone = true;
      }
    });
  });
};

Async.delay = function(amount, value) {
  return new Async(function (callback) {
    setTimeout(callback, amount, value);
  });
};

Async.measureTime = function(async) {
  return new Async(function (callback) {
    var start = new Date();
    async.run(function(_) {
      var end = new Date();
      callback(end - start);
    });
  });
};

Async.measureTime(
  Async.pure(add)
       .applic(Async.delay(2000, 1))
       .applic(Async.delay(2000, 2))
    ).run(function(t) {
  console.log("Async ran in " + t + " milliseconds");
});

