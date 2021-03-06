/**
 * Sitespeed.io - How speedy is your site? (http://www.sitespeed.io)
 * Copyright (c) 2014, Peter Hedenskog, Tobias Lidskog
 * and other contributors
 * Released under theApache 2.0 License
 */
var path = require('path'),
  async = require('async'),
  conf = require('./config.js'),
  util = require('./util/util'),
  fileHelper = require('./util/fileHelpers'),
  AnalyzeOneSite = require('./analyzeOneSite'),
  AnalyzeMultipleSites = require('./analyzeMultipleSites'),
  winston = require('winston');

function Sitespeed() {}

/**
 * Run and analyze a site or multiple sites.
 * To test one site, your config object needs to contain a url
 * config.url or point a text file with multiple urls (config.file).
 *
 * To test multiple sites your configuration needs to point out a text file
 * with multiple start urls by config.sites.
 *
 * @param config the sitespeed config object, see cli.js & config.js for now :)
 * @param finishedCb a callback that will be called when everything is finished
 */
Sitespeed.prototype.run = function(config, finishedCb) {

  // use the config object and add default values for
  // the configuration that we are missing
  this.config = conf.setupDefaultValues(config);

  finishedCb = finishedCb || function(err) {};

  var self = this;

  // lets do a couple of things as start:
  // 1. Setup the data dir, where we will store everything
  // 2. Write the config file, so we can debug or reuse it later
  // 3. Log the versions of the software we are depending on
  async.series([

      function(cb) {
        fileHelper.createDir(path.join(self.config.run.absResultDir, self.config.dataDir), cb);
      },
      function(cb) {
        self._setupLog(cb);
      },
      function(cb) {
        fileHelper.writeConfigurationFile(self.config, cb);
      },
      function(cb) {
        util.logVersions(self.config,cb);
      }
    ],

    function(err, results) {
      if (err) {
        return finishedCb(err);
      }
      // test multiple sites if it is configured
      // else test one site
      if (self.config.sites) {
        var analyzeMultipleSites = new AnalyzeMultipleSites(config);
        analyzeMultipleSites.run(finishedCb);
      } else {
        var analyzeOneSite = new AnalyzeOneSite(config);
        analyzeOneSite.run(finishedCb);
      }
    });
};

Sitespeed.prototype._setupLog = function(cb) {
  var logLevel = this.config.verbose ? 'verbose' : 'info';

  winston.loggers.add('sitespeed.io', {
    file: {
      level: logLevel,
      json: false,
      label: 'sitespeed',
      filename: path.join(this.config.run.absResultDir, 'sitespeed.io.log')
    },
    console: {
      level: logLevel,
      colorize: !this.config.noColor,
      silent: (this.config.tap || this.config.junit || this.config.silent)
    }
  });

  this.log = winston.loggers.get('sitespeed.io');
  cb();
};

module.exports = Sitespeed;
