const { PactV4 } = require('@pact-foundation/pact');
const path = require('path');

const provider = new PactV4({
  consumer: 'aureva-rewards-frontend',
  provider: 'aureva-rewards-backend',
  dir: path.resolve(__dirname, '../pacts'),
  logLevel: 'warn',
});

module.exports = { provider };
