
Timer = function(storage, ch) {

  var self = this;
  var timer_period = 5000; //check time every five seconds

  this.getTime = function() {
  	return self.now = new Date().getTime();
  } 

  this.getTime();

  function load(name, default_value) {
    return storage[name] ? storage[name] : default_value;
  }
  
  
  var beepObject = null;
  function beep() {
    if (load('play_sound', 'true') == 'true') {
      if (!beepObject) {
        beepObject = document.getElementById('beep');
      }
      beepObject.Play();
    }
  }   
  
  // timer functions

  function countdown(seconds, reset) {
    if (reset || (time_left() <= 0)) {
      storage['count_down'] = seconds;
      storage['started_at'] = self.now;
    }
  }

  function seconds_past(from) {
  	return (self.now - from)/1000;
  }
  
  function time_left() {
    return storage['count_down'] - seconds_past(storage['started_at']);
  }
  
  
  // good Job window
  
  function goodJob() {
    if (load('open_window', 'true') == 'true') { 
      ch.windows.create({
          url:'good-job.html',
          width:150,
          height:350
        });
    }
  }
  
  
  // states
    
  function work(reset) {
    storage['period'] = 'working';
    ch.browserAction.setBadgeBackgroundColor({color:[180,0,0,255]});
    countdown(load('work_length', 25) * 60, reset);
  }

  function worktick(rest) {
    if (rest <= 0) {      
      goodJob();
      sleep();
      beep();
    }  
  }
  
  function sleep(reset) {
    storage['period'] = 'resting';
    ch.browserAction.setBadgeBackgroundColor({color:[0,180,0,255]});
    countdown(load('rest_length', 5) * 60, reset);
  }

  function sleeptick(rest) {
    if (rest <= 0) {    
      work();
      beep();
    }
  }


  // the clock
  // makes sure the clock is running and defends itself against its code

  this.tick = function(first) {
    first = first ? first : false;
    
    // tick states and initialize them if needed
    try {
      var now = this.getTime();
      storage['last_tick'] = now;
      var rest = time_left(now);
      if (storage['period'] == 'resting') {
        if (first) {
         	sleep(false);
        }
        sleeptick(rest);
      } else if (storage['period'] == 'working') {
        if (first) {
         	work(false);
        }
        worktick(rest);
      } else {        
        return;
      }
    } catch (e) {
    	console.error(e);
    }
    
    // what applies for both states
    try {
      if (storage['period']) {
        ch.browserAction.setTitle({title:'You are '+storage['period']+'.'});
      }
      rest = time_left(now);
      ch.browserAction.setBadgeText({
        text : Math.ceil(rest / 60)+''
      });
    } catch (e) {
    	console.error(e);
    }
    self.timeout = setTimeout("timer.tick()", timer_period);
  }
  
  
  // initialize
  
  ch.browserAction.setIcon({path:'chromodoro_'+load('icon', 'default')+'.png'});

  
  if (time_left() > 0) {
  	this.tick(true); // resume
  } else if (seconds_past(storage['last_tick']) < 60) {
  	this.tick(true);
  }
  
  ch.browserAction.onClicked.addListener(function(timer) {
    return function(tab) {
      if (storage['period'] != 'working' && storage['period'] != 'resting') {
        timer.getTime();
        work(true);
        timer.tick();
      } else {    
        storage['period'] = 'stopped';
        ch.browserAction.setTitle({title:'Click to start working cycle.'});
        ch.browserAction.setBadgeText({text:''});
        clearTimeout(self.timeout);
      }
    }
  }(this));
}



