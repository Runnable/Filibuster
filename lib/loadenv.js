'use strict';
var dotenv = require('dotenv');
var eson = require('eson');
var path = require('path');
var env = process.env.NODE_ENV;
module.exports = readDotEnvConfigs;
var read = false;

function readDotEnvConfigs () {
  if (read === true) {
    return;
  }
  read = true;
  dotenv._getKeysAndValuesFromEnvFilePath(path.resolve(__dirname, '../configs/.env'));
  dotenv._getKeysAndValuesFromEnvFilePath(path.resolve(__dirname, '../configs/.env.'+ env));
  dotenv._setEnvs();
  dotenv.load();

  process.env = eson()
    .use(convertStringToNumeral)
    .parse(JSON.stringify(process.env));


}
function convertStringToNumeral(key, val) {
  if (!isNaN(val)) {
    return parseInt(val);
  } else {
    return val;
  }
}