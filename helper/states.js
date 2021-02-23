var states = require('../public/scripts/states.json');

var getStateCodeByStateName = function (name) {
    var stateCode;
    for (var key in states) {
        if (states[key] == name) {
            stateCode = key;
        }
    }
    return stateCode || null;
};

module.exports = {
    getStateCodeByStateName: getStateCodeByStateName
};
