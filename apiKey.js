const argv = require('minimist')(process.argv.slice(2));
module.exports = {
    apiKey: argv.API_KEY
};
