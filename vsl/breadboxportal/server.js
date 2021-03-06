/*##############################################################################
# Copyright 2018,2020 IBM Corp. All Rights Reserved.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
##############################################################################*/
/* eslint-env node */
'use strict';

var log = require('loglevel');
log.setLevel(process.env.loglevel || 'debug');

var appEnv = require('cfenv').getAppEnv();
var services = appEnv.getServices();
log.debug('services: %j', services);
 
var express = require('express');
var app = express();

app.enable('trust proxy');
app.use(function(req, res, next) {
  if (req.secure || process.env.DEV) {
    //request was via https, so do no special handling
    next();
  } else {
    // request was via http, so redirect to https
    res.redirect('https://' + req.headers.host + req.url);
  }
});

var breadboxCredentials = JSON.parse(process.env.JWT_SHARED_SECRET);
log.debug('breadboxCredentials: %j', breadboxCredentials);

var cloudantCredentials = services.cloudantconfig.credentials;
log.debug('cloudantCredentials: %j', cloudantCredentials);

require('./procid.js')({
  app: app,
  sharedSecret: breadboxCredentials.secret,
  cloudantCredentials: cloudantCredentials
});

var ENV_PREFIX = 'BBCONFIG_';
var appConfig = {};

for (var key in process.env) {

  if (key.indexOf(ENV_PREFIX) === 0) {

    var newKey = key.substring(ENV_PREFIX.length);
    appConfig[newKey] = process.env[key];
  }
}
log.debug('appConfig: %j', appConfig);

app.get('/app/config/APP_CONFIG.json', function(req, res) {

  log.debug('Getting the config file');
  log.debug('req.user: %j', req.user);
  log.debug('returning: %j', appConfig);
appConfig = {
  "listService": "https://vsllistws-something-unique.mybluemix.net",
  "poService" :"https://example2.mybluemix.net",
  "usersDb" :"users",
  "pointsDb" : "points",
  "recDb" :"rec",
  "vslDb" :"vsl"
};
  res.json(appConfig);
});

app.get('/', function(req, res) {

  log.debug('redirect to /landing.html');
  res.redirect('/landing.html');
});

app.use(express.static('www'));

// Starting the server
const port = 'PORT' in process.env ? process.env.PORT : 8080;
app.listen(port, function () {
        const address = (this.address().address === '::') ? 'localhost' : this.address().address;
        const port = this.address().port;
//        console.log(`Example app listening on ${address}:${port}`)
        log.info('Bread Box Web App listening at https://%s:%s', address, port);
});
