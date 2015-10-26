#!/usr/bin/env node

'use strict';

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

var HOME_DIR = process.env.HOME;
var LOG_JSON_FILENAME = path.join(HOME_DIR, 'Dropbox/git/activitylog/log.json');
var DAYONE = path.join(HOME_DIR, 'Dropbox/Apps/Day\ One/Journal.dayone/entries/');
var RECENTDAYS = 7;
var logJson = JSON.parse(fs.readFileSync(LOG_JSON_FILENAME, 'utf8'));

var options = {};
if (process.argv.length > 2) {
  for (var i = 2; process.argv.length > i; i++) {
    switch (process.argv[i]) {
      case '-d':
        options['date'] = process.argv[i + 1];
        break;
      default:
        break;
    }
  }
}

if (!options['date']) {
  options['date'] = moment().format('YYYY-MM-DD');
};

var startDay = moment(options['date']).subtract(RECENTDAYS, 'days').format('YYYY-MM-DD');
var endDay = moment(options['date']).add(1, 'days').format('YYYY-MM-DD');

var days = [];
for (var i = 0; i <= RECENTDAYS; i++) {
  days.push(moment(startDay).add(i, 'days').format('YYYY-MM-DD'));
}
days.sort(function(a, b) {
  if (a > b) return -1;
  if (a < b) return 1;
  return 0;
});
//console.log("days:");
//console.log(days);

var recentDaysLog = logJson.filter(function(item, index) {
  if (moment(item.datetime).isBetween(startDay, endDay)) return true;
});
//console.log("recentDaysLog:");
//console.log(recentDaysLog);

var allProjects = [];
for (var log of recentDaysLog) {
  if (allProjects.indexOf(log.project) < 0) {
    allProjects.push(log.project);
  }
};
allProjects.sort();
//console.log("allProjects:");
//console.log(allProjects);

var projectCount = [];
for (var i = 0, len = days.length; i < len; i++) {
  var tmparray = {};
  tmparray['date'] = days[i];
  tmparray['count'] = {};
  projectCount.push(tmparray);
}
for (var log of projectCount) {
  for (var i = 0, len = allProjects.length; i < len; i++) {
    log['count'][allProjects[i]] = 0;
  }
}

var tmpDateFilterReg, tmpDateFilterdLog;
for (var log of projectCount) {
  tmpDateFilterReg = new RegExp(log['date']);
  tmpDateFilterdLog = recentDaysLog.filter(function(item, index) {
    if (item.datetime.match(tmpDateFilterReg)) return true;
  });
  for (var datelog of tmpDateFilterdLog) {
    log['count'][datelog['project']] += 1;
  }
}
//console.log("projectCount:");
//console.log(projectCount)

var todayFilterReg = new RegExp(options['date']);
var todayFilteredLog = recentDaysLog.filter(function(item, index) {
  if (item.datetime.match(todayFilterReg)) return true;
});
todayFilteredLog.sort(function(a, b) {
  if (a.project < b.project) return -1;
  if (a.project > b.project) return 1;
  if (a.datetime < b.datetime) return -1;
  if (a.datetime > b.datetime) return 1;
});
//console.log(todayFilteredLog);

var table = ["|  |", "|---|"];
var tmpStr = "";
for (var i = 0, len = allProjects.length; i < len; i++) {
  tmpStr = "";
  tmpStr += "| " + allProjects[i] + " | ";
  table.push(tmpStr);
}
for (var log of projectCount) {
  var tableNum = 2
  table[0] += moment(log['date']).format('MM-DD(ddd)') + " |";
  table[1] += ":-:|"
  for (var key in log['count']) {
    if (log['count'][key] > 0 ) {
      //table[tableNum] += "X (" + log['count'][key] + ") | ";
      table[tableNum] += "X | ";
    } else {
      table[tableNum] += "  | "
    }
    //table[tableNum] += log['count'][key].toString() + " | ";
    tableNum += 1;
  }
}
table = table.join("\n");

var entryText =
  '# 今日のまとめ' + '\n' +
  '### 1週間のまとめ' + '\n' +
  table + '\n\n***\n\n';

var projectSortedLog = {}
for (var log of todayFilteredLog) {
  if (!projectSortedLog[log['project']]) {
    projectSortedLog[log['project']] = [];
  }
  projectSortedLog[log['project']].push(log);
}
for (var key in projectSortedLog) {
  entryText += "### " + key + "\n";
  for (var log of projectSortedLog[key]) {
    entryText += "- " + log['datetime'].substring(11, 16) + " - " + log['text'] + "\n";
  }
  entryText += "\n***\n\n";
}

var uuid = execSync('uuidgen').toString().replace(/-/g, "").replace(/\n/g, "");
var osVersion = execSync('sw_vers -productVersion').toString().replace(/\n/g, "");

var entry =
  '<?xml version="1.0" encoding="UTF-8"?>' + '\n' +
  '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' + '\n' +
  '<plist version="1.0">' + '\n' +
  '<dict>' + '\n' +
  '	<key>Creation Date</key>' + '\n' +
  '	<date>' + options['date'] + 'T14:59:00Z</date>' + '\n' +
  '	<key>Entry Text</key>' + '\n' +
  '	<string>' + entryText + '</string>' + '\n' +
  '	<key>Starred</key>' + '\n' +
  '	<false/>' + '\n' +
  '	<key>Tags</key>' + '\n' +
  '	<array>' + '\n' +
  '		<string>daily</string>' + '\n' +
  '	</array>' + '\n' +
  '	<key>Time Zone</key>' + '\n' +
  '	<string>Asia/Tokyo</string>' + '\n' +
  '	<key>UUID</key>' + '\n' +
  '	<string>' + uuid + '</string>' + '\n' +
  '</dict>' + '\n' +
  '</plist>';

var fileName = DAYONE + uuid + '.doentry';
//console.log("entry:");
//console.log(entry);

fs.writeFile(fileName, entry, function(err) {
  console.log('created new entry.');
});
