module.exports = function () {
    //Before any feature - this is a good place for executionStart
    this.BeforeFeatures(function (features, next) {
        if (!global.$$SeaLights$$) return next();
        //console.log('SL: ' + global.$$SeaLights$$);
        executionID = new Date().valueOf().toString();
        //console.log('ExecutionID started: ' + executionID);
        global.$$SeaLights$$.pushEvent({
            type: 'executionIdStarted',
            executionId: executionID,
            framework: 'cucumber'
        });
        next();
    });

    //After all features - this is a good place for executionEnd and shutdown (empty queues)
    //Timeout here is 60 seconds to allow for retries and slow network
    this.AfterFeatures(function (features, next) {
        if (!global.$$SeaLights$$) return next();
        //console.log('ExecutionID ended: ' + executionID);
        global.$$SeaLights$$.pushEvent({type: 'executionIdEnded', executionId: executionID, meta: {}});
        executionID = null;
        global.$$SeaLights$$.shutDown(function () {
            //console.log('shutdown');
            next(); //Wait for shutdown to complete before calling next(), which may terminate the process.
        });
    });

    this.BeforeScenario(function (scenario, next) {
        if (!global.$$SeaLights$$) return next();
        var scenarioDesc = scenario.getKeyword() + ' ' + scenario.getName();

        var fullPath = [scenario.getFeature().getName(), scenario.getName(), scenarioDesc];
        global.$$SeaLights$$.setCurrentTestIdentifier(executionID + '/' + fullPath.join(' '));

        var testName = fullPath.join(' ');
        global.$$SeaLights$$.pushEvent({
            type: 'testStart',
            testName: testName,
            executionId: executionID,
            testSuitePath: fullPath,
            meta: {}
        });

        next();
    });


    //Test end. This occurs after StepResult, so there is nothing much to do, maybe clear current test identifier
    this.AfterScenario(function (scenario, next) {
        if (!global.$$SeaLights$$) return next();
        global.$$SeaLights$$.setCurrentTestIdentifier();

        next();
    });

	Object.keys(this).forEach(function(i){
		console.log('key: '+i);
	});
	
    //Test result (Step result)
    this.ScenarioResult && this.ScenarioResult(function (scenarioResult, next) {
        var scenario = scenarioResult.getScenario();
        if (!global.$$SeaLights$$) return next();

        var scenarioDesc = scenario.getKeyword() + ' ' + scenario.getName();
        var fullPath = [scenario.getFeature().getName(), scenario.getName(), scenarioDesc];
        var duration = scenarioResult.getDuration();
        var status = scenarioResult.getStatus();
        var milliseconds = Math.ceil(scenarioResult.getDuration() / 1e6);


        if (status == 'pending')
            status = 'skipped';

        var testName = fullPath.join(' ');
        global.$$SeaLights$$.pushEvent({
            type: 'testEnd',
            testName: testName,
            executionId: executionID,
            result: status,
            duration: milliseconds,
            meta: {}
        });

        next();
    });
};
