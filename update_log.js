#!/usr/bin/env node

'use strict';

var path = require('path');
var fs = require('fs');
var moment = require('moment');

var now = moment().format('YYYY-MM-DD-HHmmss');

var HOME_DIR = process.env.HOME;
var RAWLOG_FILENAME = path.join(HOME_DIR, 'Dropbox/activity/rawlog.txt');
var LOG_JSON_FILENAME = path.join(HOME_DIR, 'Dropbox/git/activitylog/log.json');
var RAWLOG_BACKUP_FILENAME = path.join(HOME_DIR, 'Dropbox/activity/bk/rawlog_' + now + '.txt');

var rawLogTextString = fs.readFileSync(RAWLOG_FILENAME, 'utf8').replace(/\n\s*\n/g, "\n");
var logJsonArray = JSON.parse(fs.readFileSync(LOG_JSON_FILENAME, 'utf8'));

console.log("create rawlog.txt backup file: " + RAWLOG_BACKUP_FILENAME);
fs.writeFileSync(RAWLOG_BACKUP_FILENAME, rawLogTextString);
console.log("done.")

var rawLogArray = rawLogTextString.replace(/;;;[ ]*/g, ";;;").replace(/\n/g, "").split(";;;");
rawLogArray.pop();

var log = null,
  ar = null,
  jsonData = null,
  tmpDateTime = null,
  tmpDateArray = null,
  tmpDate = null,
  formattedDateTime = null;

var iftttDateFormat = /[a-zA-z].+[ ]+\d{1,2},[ ]+\d{4}/g;

for (var log of rawLogArray) {
  ar = log.split(":::");
  //console.log(ar);
  if (ar[1].match(iftttDateFormat)) {
    tmpDateArray = ar[1].split(" at ");
    tmpDate = new Date(tmpDateArray[0]);
    tmpDateTime = tmpDate.getFullYear() + "-" + (tmpDate.getMonth() + 1) + "-" + tmpDate.getDate() + " " + tmpDateArray[1];
    formattedDateTime = moment(tmpDateTime, "YYYY-MM-D hh:mmA");
  } else {
    formattedDateTime = moment(ar[1]);
  };
  jsonData = {
    "project": ar[0],
    "datetime": formattedDateTime.format("YYYY-MM-DD HH:mm:ss"),
    "text": ar[2]
  };
  logJsonArray.push(jsonData);
};

logJsonArray.sort(function(a, b) {
  return (a.datetime > b.datetime ? 1 : -1);
})
//console.log(logJsonArray)
console.log("----");
console.log("update log.json file: " + LOG_JSON_FILENAME);
fs.writeFileSync(LOG_JSON_FILENAME, JSON.stringify(logJsonArray, null, 2));
console.log("done.")

console.log("----");
console.log("refresh rawlog.txt file: " + RAWLOG_FILENAME);
fs.writeFileSync(RAWLOG_FILENAME, "");
console.log("done.")
