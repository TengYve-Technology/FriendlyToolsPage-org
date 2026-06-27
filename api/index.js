const app = require('../Backend/index');

module.exports = function handler(req, res) {
    return app(req, res);
};