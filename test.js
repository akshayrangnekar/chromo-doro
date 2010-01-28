
function runTest() {

var ChromeMock = function() {

  this.extension = new (function() {
    this.onRequest = new EventPoint();
  })();

  this.tabs = new (function() {
    this.onSelectionChanged = new EventPoint();
    this.executeScript = function() {};
    this.getSelected = function() {};
  })();



	this.browserAction = new (function() {
	
		this.setIcon = function(icon) {
			this.icon = icon;
		}

		this.setBadgeBackgroundColor = function(o) {
			this.badgeBackgroundColor = o.color;
		}

    this.setBadgeText = function(p) {
      this.badgeText = p.text;
    }

    this.setTitle = function(title) {
      this.title = title;
    }
		
		this.onClicked = new EventPoint();


	})();
  return this;
}


bdd.scenario("Mocking the browser API", function(a) {

	this.describe("ChromeMock", {
		shouldHaveBrowserAction : function () {
			var mock = new ChromeMock();
			a.isObject(mock);
			a.isObject(mock.browserAction);
		},    
	});	
		
	this.describe("BrowserACtion", {
		shouldHaveSetIcon : function () {
			var mock = new ChromeMock();
			a.isFunction(mock.browserAction.setIcon);
		},
    
		shouldHaveOnClicked : function () {
			var mock = new ChromeMock();
			a.isObject(mock.browserAction.onClicked);
		},

		shouldCallListenerOnClicked : function () {
			var mock = new ChromeMock();
			var called = false;
			mock.browserAction.onClicked.addListener(function() {
				called = true;
			});
			mock.browserAction.onClicked.fire();
			a.isTrue(called);
		},
		
		shouldMockSetBadgeBackgroundColor : function () {
			var mock = new ChromeMock();
			mock.browserAction.setBadgeBackgroundColor({color:'blueish green'});
			a.areEqual(mock.browserAction.badgeBackgroundColor, 'blueish green');
		},
	});
  	
});


TimerMock = (function(a, b) {
  var timer = new Timer(a, b);
  this._timer = timer;
  var time = null;
  var self = this;
  
  timer._getTime = timer.getTime;
  
  timer.setTime = function(t) {
  	timer.now = t;  
    time = t;
  }
  
  timer.getTime = function() {
    if (time != null) {
    	return time;
    } else {
    	return timer._getTime();
    }
  }

  timer.requestAckFor.addListener(function (e) {
      self.requestedAck = e;
      e.stop();
    });

  // no beeping here
  timer.beep = function() {}

  for (var i in timer) {
  	this[i] = timer[i];
  }

});


bdd.scenario("Mocking Timer", function(a) {

	this.describe("TimerMock", {
		shouldMockTime : function () {
			var mock = new ChromeMock();
			var timer = new TimerMock({}, mock);
      timer.setTime(123);
      a.areEqual(123, timer._timer.now);
      a.areEqual(123, timer.getTime());
		},    
	});	
  	
});





bdd.scenario("ChromoDoro usage", function(a) {
	this.describe("ChromoDoro", {

		beforeEach : function () {},	
		afterEach : function () {},

		shouldStartCountdownAfterClick : function () {
			var mock = new ChromeMock();
			var ls = {};
			var timer = new TimerMock(ls, mock);

    	timer.setTime(123);

			mock.browserAction.onClicked.fire();

      // sets timeout
      a.isTrue(timer._timer.timeout > 0);

      // sets right period
			a.areEqual('working', timer.machine.state.name);
			a.areEqual('working', ls['period']);

      // sets countdown
      a.areEqual(25*60, ls['count_down']);
      a.areEqual(123, ls['started_at']);
		},

		shouldStopAfterStopping : function () {
			var mock = new ChromeMock();
			var ls = {};
			var timer = new TimerMock(ls, mock);

    	timer.setTime(123);

      // start countdown
			mock.browserAction.onClicked.fire();
      //timer.tick();

      // stop countdown
      mock.browserAction.onClicked.fire();

      // sets right period
			a.areEqual('stopped', timer.machine.state.name);
			a.areEqual('stopped', ls['period']);

      // should stop the timer
      a.areEqual(null, timer._timer.timeout);      
      a.areEqual('', mock.browserAction.badgeText);
      a.areEqual('Click to activate.', mock.browserAction.title.title);

      // sets countdown
      a.areEqual(25*60, ls['count_down']);
      a.areEqual(123, ls['started_at']);
		},

		shouldCountDownMinutes : function () {
			var mock = new ChromeMock();
			var timer = new TimerMock({}, mock);

    	timer.setTime(0);

      // start countdown
			mock.browserAction.onClicked.fire();

      timer.tick();
      // showing 25 minutes
			a.areEqual('25', mock.browserAction.badgeText);
      a.areEqual('180,0,0,255', mock.browserAction.badgeBackgroundColor+'');

    	timer.setTime(60*1000);
      timer.tick();

      // showing 25 minutes
			a.areEqual('24', mock.browserAction.badgeText);
		},

		shouldWaitForBreakAck : function () {
			var mock = new ChromeMock();
      var ls = {};
			var timer = new TimerMock(ls, mock);

    	timer.setTime(0);
      // start countdown
			mock.browserAction.onClicked.fire();
      timer.tick();

      // work should be over
    	timer.setTime(25*60*1000);
      timer.tick();

			a.areEqual('waiting for rest ack', timer.machine.state.name);
			a.areEqual('waiting for rest ack', ls['period']);

      a.areEqual('ACK', mock.browserAction.badgeText);
      a.areEqual('rest', timer.requestedAck.state);
		},

		shouldNotDisplayTimeWhileWaitingForBreakAck : function () {
			var mock = new ChromeMock();
      var ls = {};
			var timer = new TimerMock(ls, mock);

    	timer.setTime(0);
      // start countdown
			mock.browserAction.onClicked.fire();
      timer.tick();

      // work should be over
    	timer.setTime(25*60*1000);
      timer.tick();

      a.areEqual('ACK', mock.browserAction.badgeText);

      // work should be over
    	timer.setTime(26*60*1000);
      timer.tick();

      a.areEqual('ACK', mock.browserAction.badgeText);
		},



		shouldRestAfterAckingRest : function () {
			var mock = new ChromeMock();
      var ls = {};
			var timer = new TimerMock(ls, mock);

      timer.setTime(0);

      timer.machine.setState('waiting for rest ack');
      timer.machine.accept('ack rest');

			a.areEqual('resting', timer.machine.state.name);
			a.areEqual('resting', ls['period']);
      
      // showing 5 minutes in green
			a.areEqual('5', mock.browserAction.badgeText);
      a.areEqual('0,180,0,255', mock.browserAction.badgeBackgroundColor+'');
      
    	timer.setTime(60*1000);
      timer.tick();

      // showing 25 minutes
			a.areEqual('4', mock.browserAction.badgeText);
		},

    
		shouldNotCountWhileWaitingForRestAck : function () {
			var mock = new ChromeMock();
			var timer = new TimerMock({}, mock);

    	timer.setTime(0);
      timer.machine.setState('waiting for rest ack');
      timer.tick();

      // waiting for rest ack for two minutes
    	timer.setTime(2*60*1000);
      timer.tick();

      // ack rest
      timer.machine.accept('ack rest');
      timer.tick();
      
      // showing 5 minutes in green
			a.areEqual('5', mock.browserAction.badgeText);
      a.areEqual('0,180,0,255', mock.browserAction.badgeBackgroundColor+'');

    	timer.setTime((2+1)*60*1000);
      timer.tick();

      // showing 25 minutes
			a.areEqual('4', mock.browserAction.badgeText);
		},
    

		shouldWaitForWorkAckAfterResting : function () {
			var mock = new ChromeMock();
      var ls = {};
			var timer = new TimerMock(ls, mock);

    	timer.setTime(0);
      timer.machine.setState('start resting');

    	timer.setTime(5*60*1000);
      timer.tick();

      // state should change
			a.areEqual('waiting for work ack', timer.machine.state.name);
			a.areEqual('waiting for work ack', ls['period']);

      // should be waiting for work ack
      a.areEqual('work', timer.requestedAck.state);
      
      a.areEqual('ACK', mock.browserAction.badgeText);
		},

		shouldWorkAfterAckingWork : function () {
			var mock = new ChromeMock();
      var ls = {};
			var timer = new TimerMock(ls, mock);

    	timer.setTime(0);
      timer.machine.setState('waiting for work ack');

      timer.machine.accept('ack work');

			a.areEqual('working', timer.machine.state.name);
			a.areEqual('working', ls['period']);
		},

		shouldResumeWorking : function () {
			var mock = new ChromeMock();
      var ls = {};
			var timer = new TimerMock(ls, mock);

      mock.browserAction.onClicked.fire();

      timer = new TimerMock(ls, mock);

      // resume state
			a.areEqual('working', timer.machine.state.name);

      // start ticking
			a.isTrue(timer._timer.timeout > 0);
		},

		shouldResumeWaitingForRestAck : function () {
			var mock = new ChromeMock();
      var ls = {};
			var timer = new TimerMock(ls, mock);

     	timer.setTime(0);
      // start countdown
			mock.browserAction.onClicked.fire();
      timer.tick();

      // work should be over
    	timer.setTime(25*60*1000);
      timer.tick();

      timer = new TimerMock(ls, mock);

      // resume state
			a.areEqual('waiting for rest ack', timer.machine.state.name);

      // start ticking
			a.isTrue(timer._timer.timeout > 0);
		},

		shouldThrowIfSettingtimerAgain : function () {
			var mock = new ChromeMock();
      var ls = {};
			var timer = new TimerMock(ls, mock);

      // setup ticking
      timer.tick(true);
      var t1 = timer._timer.timeout;

      // setup ticking again
      try {
        timer.tick(true);
        a.fail();
      } catch(e) {
        a.areEqual('Timer already set.', e.message);
      }

      // make sure the timer was not re-set
      var t2 = timer._timer.timeout;
			a.areEqual(t1, t2);
		},

	});	
});		

bdd.runInside('testLogger');

};