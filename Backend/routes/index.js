const convertRoutes = require('./convert');
const securityRoutes = require('./security');
const funRoutes = require('./fun');
const textRoutes = require('./text');
const dataRoutes = require('./data');

function registerRoutes(app, dependencies) {
    convertRoutes(app, dependencies);
    securityRoutes(app, dependencies);
    funRoutes(app, dependencies);
    textRoutes(app, dependencies);
    dataRoutes(app, dependencies);
    return app;
}

module.exports = registerRoutes;