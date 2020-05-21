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

var util = require('util');

var cfenv = require('cfenv');

// work around intermediate CA issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

var cookieParser = require('cookie-parser');
var session = require('express-session');

function unwrap(wrapped) {
  if (util.isArray(wrapped) && wrapped.length > 0) {
    wrapped = wrapped[0];
  }
  return wrapped;
}

var jwt = require('jsonwebtoken');

function processuser(options, cb) {

   var profile = {"id":"jessejes@example.com","_json":{"given_name":"Jesse","family_name":"JES"}};

// log.debug('new options 1: %j', options);

options = options || {};

log.debug('new options 2: %j', options);

var userDb = require('./userDb.js')(options.cloudantCredentials);

userDb.updateVslUser(unwrap(profile.id), unwrap(profile._json.given_name)+" "+unwrap(profile._json.family_name)).then(
function() {
var token = jwt.sign({}, options.sharedSecret, {
expiresIn: '12h',
subject: unwrap(profile.id),
issuer: 'breadbox'
});
cb(token);
});

options.app.get('/auth/callback', function(req, res) {
  processuser(options, function(bigtoken) {log.debug('bigtoken: %s', bigtoken);
               res.redirect('/index.html?access_token=' + bigtoken);});
});
};

module.exports = processuser;
