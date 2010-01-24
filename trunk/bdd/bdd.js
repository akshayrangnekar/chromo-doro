
bdd = (function() {
	var bdd = function() {
		this.descriptions = [];
		this.scenarios = [];
		this.should = {};
	}
	
	bdd.prototype.scenario = function(name, fn) {
		this.scenarios.push({name:name, fn:fn});
	}
	
	bdd.prototype.describe = function(subject, behaviour) {
		this.descriptions.push({subject:subject, behaviour:behaviour});
	}

	bdd.prototype.runInside = function(elementId) {
		this.ouputElementId = elementId;
	}
	
	bdd.prototype.setupSuite = function(name, descriptions) {
		var suite = new this.Y.Test.Suite(name);
		for (d in descriptions) {
			suite.add(
				new this.Y.Test.Case(
					this.translate(descriptions[d])
				)
			);
		}
		return suite;
	}
	
	bdd.prototype.setYUI = function(Y) {
		this.Y = Y;		
		
		this.setupOutput();
		
		this.runScenarios(this.scenarios);
	}
	
	bdd.prototype.runScenarios = function(scenarios) {
		for (var s in scenarios) {			
			this.Y.Test.Runner.add(
				this.setupSuite(
					scenarios[s].name,
					this.extractDescriptions(scenarios[s].fn)
				)
			);			
		}
		//run the tests
		this.Y.Test.Runner.run();	
	}
	
	bdd.prototype.extractDescriptions = function(fn) {
		this.descriptions = [];
		fn.call(this, this.Y.Assert);
		return this.descriptions;
	}
	
	bdd.prototype.setupOutput = function() {
		this.setupLogger();
		this.setupReporter();		
	}
	
	bdd.prototype.setupLogger = function() {
		var Y = this.Y;

		var r = new Y.Console({
			verbose : false,
			consoleLimit : 10000,
			newestOnTop : false
		});
		r.render('#'+this.ouputElementId);
	}

	bdd.prototype.setupReporter = function() {
		var Y = this.Y;		

		Y.Test.Runner.disableLogging();

		// how the results should be logged
		Y.Test.Runner.subscribe('testcasecomplete', function(suite) {
			var kind = suite.results.failed == 0 ? 'pass' : 'fail';
			Y.log(suite.testCase.name+' > '+
				"passed: "+suite.results.passed+
				", failed: "+suite.results.failed+
				", total: "+suite.results.total, kind);
		});

		Y.Test.Runner.subscribe('fail', function(test) {
			Y.log(test.testName + ": " + test.error + "\n" + test.error.stack, test.type);
			//console.log(test);
		});
	}

	bdd.prototype.translate = function(description) {
		var caseConfig = {name:description.subject};
		
		for (var b in description.behaviour) {
			var should = b.substr(0, 6);
			var doWhat = b.substr(6, b.length - 6);
			if (should == 'should') {
				//console.log(should, doWhat);
				caseConfig[('testShould'+doWhat)] = description.behaviour[b];
			}
		}
		if (description.behaviour['beforeEach']) {
			caseConfig['setUp'] = description.behaviour['beforeEach'];
		}
		if (description.behaviour['afterEach']) {
			caseConfig['tearDown'] = description.behaviour['afterEach'];
		}
		return caseConfig;
	}


	return new bdd();
})();


YUI({timeout: 10000}).use("node", "console", "yuitest",function (Y) {
	try {
		bdd.setYUI(Y);
	} catch (e) {
		Y.log(e, 'error');
	}
});