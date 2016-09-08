var PreProcessor;

PreProcessor = (function() {
  var buildEnvironmentsMatch, contructor, getEndNextStatement, getLastItemInList, getNextStatement, getNextStatementIndex, list;

  function PreProcessor() {}

  list = [];

  contructor = function() {
    return null;
  };

  PreProcessor.prototype.process = function(data, config) {
    var after, before, i, j, lastIndex, len, len1, matched, stmt, strAfter, strBefore;
    if (config == null) {
      config = {
        buildEnv: 'debug'
      };
    }
    while (matched = getNextStatement(data)) {
      before = data.substring(0, matched.index);
      after = data.substring(matched.endIndex, data.length);
      data = before + after;
      switch (matched.statement) {
        case 'if':
          matched.match = buildEnvironmentsMatch(config.buildEnv, matched.buildEnv);
          list.push(matched);
          break;
        case 'elseif':
          matched.match = true;
          for (i = 0, len = list.length; i < len; i++) {
            stmt = list[i];
            if (stmt.match) {
              matched.match = false;
              break;
            }
          }
          if (matched.match) {
            matched.match = buildEnvironmentsMatch(config.buildEnv, matched.buildEnv);
          }
          list.push(matched);
          break;
        case 'else':
          matched.match = true;
          for (j = 0, len1 = list.length; j < len1; j++) {
            stmt = list[j];
            if (stmt.match) {
              matched.match = false;
              break;
            }
          }
          list.push(matched);
          break;
        case 'endif':
          lastIndex = matched.index;
          while (list.length > 0) {
            stmt = list.pop();
            if (!stmt.match) {
              strBefore = data.substring(0, stmt.index);
              strAfter = data.substring(lastIndex, data.length);
              data = strBefore + strAfter;
            }
            lastIndex = stmt.index;
          }
      }
    }
    return data;
  };

  getNextStatement = function(data) {
    var endIndex, last, lastIndex, matchElse, matchElseif, matchEndif, matchIf, nextIndex, nextStmtObj, regexElif, regexElse, regexEndif, regexIf, startIndex;
    regexIf = /@if \((.*?)\)\s/;
    regexElse = /@else/;
    regexElif = /@elseif \((.*?)\)\s/;
    regexEndif = /@endif/;
    last = getLastItemInList();
    lastIndex = 0;
    if (last) {
      lastIndex = last.index;
    }
    matchIf = regexIf.exec(data);
    matchElse = regexElse.exec(data);
    matchElseif = regexElif.exec(data);
    matchEndif = regexEndif.exec(data);
    nextStmtObj = null;
    nextIndex = Number.POSITIVE_INFINITY;
    if (matchIf && matchIf.index > lastIndex && matchIf.index < nextIndex) {
      startIndex = getNextStatementIndex(matchIf.index, data);
      endIndex = getEndNextStatement(matchIf.index, data);
      nextIndex = matchIf.index;
      nextStmtObj = {
        statement: 'if',
        index: startIndex,
        endIndex: endIndex,
        buildEnv: matchIf[1]
      };
    }
    if (matchElseif && matchElseif.index > lastIndex && matchElseif.index < nextIndex) {
      startIndex = getNextStatementIndex(matchElseif.index, data);
      endIndex = getEndNextStatement(matchElseif.index, data);
      nextIndex = matchElseif.index;
      nextStmtObj = {
        statement: 'elseif',
        index: startIndex,
        buildEnv: matchElseif[1],
        endIndex: endIndex
      };
    }
    if (matchElse && matchElse.index > lastIndex && matchElse.index < nextIndex) {
      startIndex = getNextStatementIndex(matchElse.index, data);
      endIndex = getEndNextStatement(matchElse.index, data);
      nextIndex = matchElse.index;
      nextStmtObj = {
        statement: 'else',
        index: startIndex,
        endIndex: endIndex
      };
    }
    if (matchEndif && matchEndif.index > lastIndex && matchEndif.index < nextIndex) {
      startIndex = getNextStatementIndex(matchEndif.index, data);
      endIndex = getEndNextStatement(matchEndif.index, data);
      nextIndex = matchEndif.index;
      nextStmtObj = {
        statement: 'endif',
        index: startIndex,
        endIndex: endIndex
      };
    }
    if (!nextStmtObj && last) {
      throw new Error("Malformed brunch preprocess conditional. " + last.statement + " statement not closed");
    }
    return nextStmtObj;
  };

  getNextStatementIndex = function(index, data) {
    var matchEnd, regexEnd, temp;
    regexEnd = /(?:\n|\r)+.*?$/;
    temp = data.substring(0, index);
    matchEnd = regexEnd.exec(temp);
    if (matchEnd != null) {
      return matchEnd.index;
    }
    return 0;
  };

  getEndNextStatement = function(index, data) {
    var matchEnd, regexEnd, temp;
    regexEnd = /(?:\n|\r)/;
    temp = data.substring(index);
    matchEnd = regexEnd.exec(temp);
    if (matchEnd != null) {
      return index + matchEnd.index;
    }
    return data.length;
  };

  getLastItemInList = function() {
    var lastIndex;
    lastIndex = list.length - 1;
    if (lastIndex >= 0) {
      return list[lastIndex];
    }
    return null;
  };

  buildEnvironmentsMatch = function(buildEnv, targetEnv) {
    var i, len, targetEnvs;
    if (targetEnv == null) {
      return buildEnv == null;
    }
    if (buildEnv == null) {
      return false;
    }
    targetEnvs = targetEnv.split('||');
    for (i = 0, len = targetEnvs.length; i < len; i++) {
      targetEnv = targetEnvs[i];
      targetEnv = targetEnv.trim();
      if (buildEnv.trim().toLowerCase() === targetEnv.trim().toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  return PreProcessor;

})();

module.exports = PreProcessor;
