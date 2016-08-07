let config = {};

// Set environment
config.env = process.env.NODE_ENV;
if(!['development', 'test', 'production'].includes(config.env)) {
  config.env = 'development';
}

module.exports = Object.assign(config, require('./env/all'), require(`./env/${config.env}`));
