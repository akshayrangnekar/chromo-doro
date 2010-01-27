
Timer = function(storage, ch) {
  var self = this;
  var timer_period = 5*1000; //check time every few seconds
  var timer = self;

  // load defaultized setting from localStorage
  function load(name, default_value) {
    return storage[name] ? storage[name] : default_value;
  }


  // timer functions

  this.getTime = function() {
  	return self.now = new Date().getTime();
  }

  this.getTime();

  function countdown(seconds) {
    storage['count_down'] = seconds;
    storage['started_at'] = self.now;
  }

  function seconds_past(from) {
  	return (self.getTime() - from)/1000;
  }

  function time_left() {
    return storage['count_down'] - seconds_past(storage['started_at']);
  }

  // send 'tick' to state machine every few seconds
  this.tick = function(set_timeout, continue_timeout) {
    //console.log(time_left());
    this.machine.accept('tick');

    if (set_timeout || continue_timeout) {
      if (set_timeout && self.timeout > 0) {
        throw new Error('Timer already set.');
      }
      self.timeout = setTimeout("timer.tick(false, true)", timer_period);
    }
  }
  


  // play sound
  var beepObject = null;
  function beep() {
    if (load('play_sound', 'true') == 'true') {
      if (!beepObject) {
        beepObject = document.getElementById('beep');
      }
      if (beepObject) {
        beepObject.Play();
      }
    }
  }


  // insert script to current page
  var insertToPage = function(what, file, callback) {
    var method;
    if (what == 'script') {
      method = ch.tabs.executeScript;
    } else if (what == 'css') {
      method = ch.tabs.insertCSS;
    } else {
      return;
    }
    var params = {file: file};
    try {
      method.call(ch.tabs, null, params, callback);
    } catch(e) {
      // Maybe this exception is due to allFrames = true, let's try without it
      if(allFrames) {
        try {
          method.call(ch.tabs, null, {file: file}, callback);
        } catch(e) {
          // This time something really bad happened, logging and ignoring
          console.log(e);
        }
      } else {
        // We don't know the motive, logging and ignoring
        console.log(e);
      }
    }
  };



  var Popup = function(ackFor) {
    var self = this;
    
    this.tabChange = function (tabId, o) {
      self.hidePopup();
      self.selectedTab = [tabId, o.windowId];
      insertToPage('script', 'popup.js');        
    };

    this.hidePopup = function() {
      try {
        ch.tabs.sendRequest(
          self.selectedTab[0],
          { popup: "hide" }
        );
      } catch (e) {
        console.error(e);
      }
    }

    this.close = function() {
      ch.tabs.onSelectionChanged.removeListener(this.tabChange);
      self.hidePopup();
    }

    ch.tabs.onSelectionChanged.addListener(this.tabChange);

    // show popup right away
    insertToPage('script', 'popup.js');
    
    ch.tabs.getSelected(null, function (o) {
      self.selectedTab = [o.id, o.windowId];
    })
  }
  

  // events

  this.requestAckFor = new EventPoint(this, false);

  this.requestAckFor.addListener(function (e) {
      if (!e.state) {        
        throw new Exception('Must specify a state to ack.');
      }
      timer.stateToAck = e.state;
      timer.popup = new Popup(e.state);
    });



  this.giveAckFor = new EventPoint(this);
  this.giveAckFor.addListener(function (e) {
      self.machine.accept('ack '+self.stateToAck);
      self.stateToAck = null;
    });




  

  // the mighty state machine
  
  this.machine = (new FSM('ChromoDoro', true)).
    onChange.addListener(function(e) {
      storage['period'] = e.newState.name;
      //console.log(e.oldState.name +' -> '+ e.newState.name);
    });

  // every tick update the counter and tooltip
  var tick = function(e) {
      if (e.input == 'tick') {
        ch.browserAction.setTitle({title:'You are '+this.name+'.'});

        // display minutes left
        var rest = time_left();
        ch.browserAction.setBadgeText({
          text : Math.ceil(rest / 60)+''
        });
        e.accept();
      }
    };


  // -- STOPPED -- 
  this.machine.addState('stopped').
    onEnter.addListener(function(e) {
        ch.browserAction.setBadgeText({text : ''});
        clearTimeout(self.timeout);
        timer.timeout = null;
      }).
    addListener(function(e) {
        if (e.input == 'click') {
          countdown(load('work_length', 25) * 60);
          this.machine.setState('working');
          // start ticking
          self.tick(true);
          e.accept();
        }
      }).
    addListener(tick);


  // stop after clicking pomodoro
  var stop = function(e) {
      if (e.input == 'click') {
        this.machine.setState('stopped');
        e.accept();
      }
    };


  // -- WORKING --
  this.machine.addState('working').    
    onEnter.addListener(function(e) {
        // set badge to red
        self.tick(); //reset badge immediately
        ch.browserAction.setBadgeBackgroundColor({color:[180,0,0,255]});
      }).
    addListener(stop).
    addListener(tick).
    addListener(function(e) {
        if (e.input == 'tick' && time_left() <= 0) {
          this.machine.setState('waiting for rest ack');
          e.accept();
          e.stop();
        }        
      });
    


  // -- WAITING FOR REST ACK --
  this.machine.addState('waiting for rest ack').
    onEnter.addListener(function() {
        ch.browserAction.setBadgeText({text : 'ACK'});
        self.requestAckFor.fire({state:'rest'});
        beep();
      }).
    addListener(function(e) {
        if (e.input == 'ack rest') {
          e.accept();
          this.machine.setState('start resting');
        }
      }).
    addListener(stop).
    addListener(function(e) {
        if (e.input == 'tick') {
          e.accept();
        }
      });


  // -- START RESTING --
  this.machine.addState('start resting').
    onEnter.addListener(function(e) {
        // start countdown
        countdown(load('rest_length', 5) * 60);
        e.accept();
        this.machine.setState('resting');
      }).
    addListener(function(e) {
        if (e.input == 'tick') {
          e.accept();
        }
      })

  // -- RESTING --
  this.machine.addState('resting').
    onEnter.addListener(function(e) {
        // set badge to green
        ch.browserAction.setBadgeBackgroundColor({color:[0,180,0,255]});
        self.tick();
      }).
    addListener(function(e) {
        if (e.input == 'tick' && time_left() <= 0) {
          this.machine.setState('waiting for work ack');
        }
      }).
    addListener(stop).
    addListener(tick);


  // -- WAITING FOR WORK ACK --
  this.machine.addState('waiting for work ack').
    onEnter.addListener(function() {
        ch.browserAction.setBadgeText({text : 'ACK'});
        self.requestAckFor.fire({state:'work'});
        beep();
      }).
    addListener(function(e) {
        if (e.input == 'ack work') {
          countdown(load('work_length', 25) * 60, true);
          this.machine.setState('working');
          e.accept();
        }
      }).
    addListener(stop).
    addListener(function(e) {
        if (e.input == 'tick') {
          e.accept();
        }
      });
    
  

  // initialize  
  ch.browserAction.setIcon({path:'chromodoro_'+load('icon', 'default')+'.png'});


  var state = load('period', 'stopped');
  this.machine.setState(state);
  if (state != 'stopped') {
    self.tick(true);
  }


  ch.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
      try {
        if (request.popupReady) {
          sendResponse({showAckFor: timer.stateToAck});
        } else if (request.name == "ackRest") {
          self.giveAckFor.fire();
          self.popup.close();
          self.popup = null;
          sendResponse('ok');
        }
      } catch (e) {
        console.error(e);
      }
    }
  );

  
  ch.browserAction.onClicked.addListener(
    function(timer) {    
      return function(tab) {
        timer.machine.accept('click');
      }
    }(self)
  );
  
  
}
