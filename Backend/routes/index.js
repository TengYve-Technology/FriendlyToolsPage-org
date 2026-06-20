const convertRoutes = require('./convert');
const securityRoutes = require('./security');
const funRoutes = require('./fun');

function registerRoutes(app, dependencies) {
    convertRoutes(app, dependencies);
    securityRoutes(app, dependencies);
    funRoutes(app, dependencies);
    return app;
}

module.exports = registerRoutes;