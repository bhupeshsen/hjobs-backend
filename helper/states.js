const fs = require('fs');

var getStateCodeByStateName = function (name) {
    const json = fs.readFileSync(__dirname + '/../public/scripts/states.json');
    const states = JSON.parse(json);

    var stateName = toTitleCase(name);

    return states[stateName] || null;
};

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

module.exports = {
    getStateCodeByStateName: getStateCodeByStateName
};
