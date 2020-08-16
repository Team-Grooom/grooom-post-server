var fs = require('fs');
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

var util = {};
util.convertTo2HeightTrees = function(array) {
    var cloned = array.slice();
    var trees = [];
    for(var i=0 ;i<cloned.length; i++) {
        item = cloned[i];
        if(!item.parentComment) {
            item.childComment = cloned.filter(elem => item._id === elem.parentComment);
            trees.push(item);
        }
    }
    return trees;
};

util.cloneObject = function(object) {
    return JSON.parse(JSON.stringify(object));
}

util.intersect = function(a, b) {
    return a.filter(x => b.includes(x));
}

util.difference = function(a, b) {
    return a.filter(x => !b.includes(x));
}

util.loadJSON = function(filename) {
    var jsonFile = fs.readFileSync(filename, 'utf8');
    return jsonData = JSON.parse(jsonFile);
}

util.getCurrentTime = function() {
    return moment().format('YYYY-MM-DD HH:mm:ss');
}

util.getNeighborhoodTownsBFS = function (townData, town, townRange) {
    // graph형태의 townData
    // town 예시
    // 서울특별시 xx동, 전라남도 xx1,2,3동, 경기도 xx3동
    var towns = [town];
    var q = [];
    townData[town][0] = true;
    q.push([town, 0]);
    while(q.length != 0) {
      var curItem = q.shift();
      var curTown = curItem[0];
      var curRange = curItem[1];
      if (curRange === townRange) {
        break;
      }
      for(var i=1; i<townData[curTown].length; i++) {
        var nextTown = townData[curTown][i];
        if(!townData[nextTown][0]) {
          townData[nextTown][0] = true;
          q.push([nextTown, curRange + 1]);
          towns.push(nextTown);
        }
      }
    }
    return towns;
}

module.exports = util;
