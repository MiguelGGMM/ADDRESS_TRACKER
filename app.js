
var path = require("path");

// Initialize dotenv for config variables
var dotenv = require('dotenv');
dotenv.config({
    path: path.resolve(__dirname + '/.env')
});

require("./dev_tracker");

console.log(`[ADDRESS_TRACKER] Just starting application in mode daemon. No port opened`);
console.log(`Environment: ${process.env.NODE_ENV}`)

String.prototype.break = function (numBreaks) {
    let str = this;
    for(var i=0; i < numBreaks; i++) {
        str += "\r\n";
    }

    return str;
};

/* module.exports = app; */