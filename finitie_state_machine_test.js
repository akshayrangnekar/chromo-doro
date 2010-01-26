function runTest() {




bdd.scenario("EventPoint Usage", function(a) {

	this.describe("EventPoint", {
		shouldCallSubscribersOnFire : function () {
      var Cat = function() {
        this.onStuffOnCat = new EventPoint(this);
      }

      var called = false;

      var cat = (new Cat()).
        onStuffOnCat.
        addListener(function() {
            called = true;
          });

      cat.onStuffOnCat.fire({stuff:'tinfoil hat'});

      a.isTrue(true, called);
		},
		shouldPassEventWithParams : function () {
      var Cat = function() {
        this.onStuffOnCat = new EventPoint(this);
      }

      var event = false;

      var cat = (new Cat()).
        onStuffOnCat.
        addListener(function(e) {
            event = e;
          });

      cat.onStuffOnCat.fire({stuff:'tinfoil hat'});

      a.areEqual('tinfoil hat', event.stuff);
		},
		shouldStopPropagatingEventAfterStopping : function () {
      var Cat = function() {
        this.onStuffOnCat = new EventPoint(this);
      }

      var called = 0;

      var cat = (new Cat()).
        onStuffOnCat.addListener(function(e) {
            called += 2;
          }).
        onStuffOnCat.addListener(function(e) {
            called += 1;
            e.stop();
          });

      cat.onStuffOnCat.fire({stuff:'tinfoil hat'});

      a.areEqual(1, called);
		},
	});
});


bdd.scenario("State Machine Definition", function(a) {

	this.describe("State Machine", {
		shouldHaveName : function () {
			var machine = new FSM("Life");
			a.areEqual('Life', machine.name);
		},    
		shouldWork : function () {
			var machine = new FSM("DayAndNight");
			machine.addState('night').addListener(function(e) {
        if (e.input == 'sunrise') {
          this.machine.setState('day');
        }
      });
			machine.addState('day').addListener(function(e) {
        if (e.input == 'sunset') {
          //console.log(this);
          this.machine.setState('night');
        }
      });
      machine.setState('day');
      machine.accept('sunset');
      a.areEqual('night', machine.state.name);
      machine.accept('sunrise');
      a.areEqual('day', machine.state.name);
		},
	});
  
		
	this.describe("State", {
		shouldBeConstructedWithAName : function () {
			var machine = new FSM("Life");
			var state = machine.addState('living');
			a.areEqual('living', state.name);
		},    
		shouldDefineListeners : function () {
			var machine = new FSM("Life");
      var called = false;
			var living = machine.addState('living').addListener(function(event) {
        called = true;
      })
      machine.setState('living');
      machine.accept('yearPassed');
			a.areEqual(true, called);
		},    
		shouldBeAbleToDefineListener : function () {
			var machine = new FSM("Life");
      var called = false;
			var living = machine.addState('living').addListener(function(event) {
        called = true;
      })
      machine.setState('living');
      machine.accept('yearPassed');
			a.areEqual(true, called);
		},        
		shouldBeAbleToDefineMoreListeners : function () {
			var machine = new FSM("Life");
      var called = 0;
      
      machine.addState('living').
        addListener(function() {
          called += 1 }).
        addListener(function() {
          called += 2 })

      machine.setState('living');
      machine.accept('yearPassed');
			a.areEqual(3, called);
		},
		shouldHaveOnEnterEvent : function () {
			var machine = new FSM("Day/Night");
      var sun = false;
      var state = machine.addState('day');
      console.log(state);
      a.isObject(state.onEnter);
      state.onEnter.addListener(function(event) {
        sun = true;
      });
      machine.setState('day');
			a.areEqual(true, sun);
		},        
	});
  

	this.describe("Listener", {
    shouldBeAbletoStopInputPropagation : function () {
			var machine = new FSM("Life");
      var called = 0;
      machine.addState('living').
        addListener(function(event) {
          called += 1;
            event.stop();
          }).
        addListener(function() {
            called += 2;
          })
      machine.setState('living');
      machine.accept('anything');
			a.areEqual(1, called);
		},       
	});
  	
});


bdd.scenario("State Machine Running", function(a) {

	this.describe("State Machine", {
		shouldShouldThrowErrorIfNoStateSetAndAcceptCalled : function () {
			var machine = new FSM("Life");
			try {
        machine.accept('');
        a.fail('Machine with unset state should raise error when accept called.');
      } catch(e) {
        a.areEqual('Cannot accept, set state first.', e.message);
      }
		},
		shouldThrowErrorWhenGettingUnknownState: function () {
			var machine = new FSM("Life");
			try {
        machine.getState('uknown');
        a.fail();
      } catch(e) {
        a.areEqual('Unknown state "uknown".', e.message);
      }
		},
		shouldProvideOnChangeEvent: function () {
			var machine = new FSM("Day/Night");
      var changed = false;
      machine.addState('day');
      machine.onChange.addListener(function() {
        changed = true;
      })
      machine.setState('day');
      a.isTrue(changed);
		},
	});

})

bdd.runInside('testLogger');

};