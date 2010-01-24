
function runTest() {

var ChromeMock = function() {
	this.browserAction = new (function() {
	
		this.setIcon = function(icon) {
			this.icon = icon;
		}
		
		this.setBadgeBackgroundColor = function(color) {
			this.badgeBackgroundColor = color;
		}
		
		this.onClicked = new (function() {
		  this.addListener = function(listener) {
			this.listener = listener;
		  }
		  this.fire = function() {
			this.listener.call();
		  }
		})();
		
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
			mock.browserAction.setBadgeBackgroundColor('blueish green');
			a.areEqual(mock.browserAction.badgeBackgroundColor, 'blueish green');
		},
	});
  	
});


TimerMock = (function(a, b) {
  var timer = new Timer(a, b);
  this._timer = timer;
  var time = null;
  
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





bdd.scenario("ChromoDoro fresh startup", function(a) {
	this.describe("ChromoDoro", {

		beforeEach : function () {},	
		afterEach : function () {},

		shouldStartCountdownAfterClick : function () {			
			var mock = new ChromeMock();
			ls = {};
			var timer = new TimerMock(ls, mock);
      
      timer.setTime(123);
      
			mock.browserAction.onClicked.fire();
      
			a.areEqual('working', ls['period']); 
      a.areEqual(25*60, ls['count_down']);
      a.areEqual(123, ls['started_at']);	  			
		},
	});	
});		

bdd.runInside('testLogger');

};