
const app = require('../Backend/index');

export default function handler(req, res) {
  return app(req, res);
}
