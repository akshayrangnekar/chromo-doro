
var Event = function(args) {
  this.stopped = false;
  this.accepted = false;

  this.accept = function() {
    this.accepted = true;
  }
  this.stop = function() {
    this.stopped = true;
  }

  this.notifyListener = function(fn, eatExceptions) {
    if (eatExceptions) {
      try {
        fn.apply(this.target, [this]);
      } catch (e) {
        console.error(e);
      }
    } else {
      fn.apply(this.target, [this]);
    }
  }

  for (var a in args) {
    this[a] = args[a];
  }
}


EventPoint = function(target, eatExceptions) {
  eatExceptions = typeof(eatExceptions) != 'undefined'  ? eatExceptions : true;
  this.listeners = [];
  this.addListener = function(fn) {
    this.listeners.push(fn);
    return target;
  }
  this.fire = function(args) {
    var event = new Event(args);
    event.target = target;
    for (var i = this.listeners.length-1; i >= 0; i--) {
      event.notifyListener(this.listeners[i], eatExceptions);
      if (event.stopped) {
        break;
      }
    }
    return event;
  }
}
  

FSM = function(name, strict) {
  this.name = name;
  this.states = {};
  this.strict = strict ? strict : false;

  var State = function(fsm, name) {    
    this.machine = fsm;
    this.name = name;
    this.eventPoint = new EventPoint(this, false);
    this.onEnter = new EventPoint(this);
    
    this.addListener = function(fn) {
      this.eventPoint.addListener(fn);
      return this;
    }
    
    this.accept = function(input) {
      var event = this.eventPoint.fire({input : input});

      // strict machiiine....
      if (this.machine.strict && !event.accepted) {
        throw new Error('Input '+input+' not accepted by any listener of '+this.name+'.');
      }
    }
  }
  
  this.addState = function(name, states) {
    return this.states[name] = new State(this, name)
  }

  this.getState = function(name) {
    var state = this.states[name];
    if (state) {
      return state;
    }
    throw new Error('Unknown state "'+name+'".');
  }
  
  this.setState = function(name) {
    var oldState = this.state;
    this.state = this.getState(name);
    this.onChange.fire({
      newState : this.state,
      oldState : oldState
    });
    this.state.onEnter.fire();
  }
  
  this.accept = function(input) {
    this.state.accept(input);
  }

  this.onChange = new EventPoint(this, false);

  // init state with warning about unset state
  this.defaultInitialState = (new State(this, null)).addListener(function() {
    throw new Error('Cannot accept, set state first.');
  });
  this.state = this.defaultInitialState;
}