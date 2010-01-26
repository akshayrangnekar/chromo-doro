

var Event = function(input) {
  this.input = input;
  this.stopped = false;
  this.accepted = false;

  this.accept = function() {
    this.accepted = true;
  }
  this.stop = function() {
    this.stopped = true;
  }
}

EventPoint = function(target) {
  this.listeners = [];
  this.addListener = function(fn) {
    this.listeners.push(fn);
    return target;
  }
  this.fire = function(args) {
    var event = new Event();
    for (var a in args) {
      event[a] = args[a];
    }
    event.target = target;
    for (var i = this.listeners.length-1; i >= 0; i--) {
      this.listeners[i].apply(target, [event]);
      if (event.stopped) {
        break;
      }
    }
  }
}
  

FSM = function(name) {	
  this.name = name;
  this.states = {};

  var State = function(fsm, name) {
    this.machine = fsm;
    this.name = name;
    this.listeners = [];
    
    this.addListener = function(fn) {
      this.listeners.push(fn);
      return this;
    }
    
    this.onEnter = new EventPoint(this);
    
    this.accept = function(input) {
      var event = new Event(input);
      for (var i = 0; i < this.listeners.length; i++) {
        this.listeners[i].apply(this, [event]);
        if (event.stopped) {        
          break;
        }
      }
      /*
      if (!event.accepted) {
        throw('Input '+input+' not accepted by any listener of '+this.name+'.');
      }
      */
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

  this.onChange = new EventPoint(this);


  // init state with warning about unset state
  this.defaultInitialState = (new State(this, null)).addListener(function() {
    throw new Error('Cannot accept, set state first.');
  });
  this.state = this.defaultInitialState;
}