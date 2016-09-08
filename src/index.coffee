class PreProcessor
  list = []

  contructor = ->
    null

  process: (data, config = {buildEnv: 'debug'}) ->
    while matched = getNextStatement(data)
      # Remove the statement from the string
      before = data.substring(0, matched.index)
      after = data.substring(matched.endIndex, data.length)
      data = before + after

      # Determine whether or not to keep this section
      switch matched.statement
        when 'if'
          matched.match = buildEnvironmentsMatch(config.buildEnv, matched.buildEnv)
          list.push(matched)
        when 'elseif'
          # If any of the previous statements had a match, then this one gets discarded
          matched.match = true
          for stmt in list
            if stmt.match
              matched.match = false
              break

          # If a previous statement didn't have a match, evaluate this statement's buildEnv
          if matched.match
            matched.match = buildEnvironmentsMatch(config.buildEnv, matched.buildEnv)

          list.push matched
        when 'else'
          # If any of the previous statements had a match, then this one gets discarded
          matched.match = true
          for stmt in list
            if stmt.match
              matched.match = false
              break

          list.push(matched)
        when 'endif'
          # Remove or keep sections as statements get popped off the stack
          lastIndex = matched.index
          while list.length > 0
            stmt = list.pop()
            if not stmt.match
              strBefore = data.substring(0, stmt.index)
              strAfter = data.substring(lastIndex, data.length)
              data = strBefore + strAfter

            # Update index position so next statement that gets processed
            # will know the bounds of that section
            lastIndex = stmt.index
    return data

  getNextStatement = (data) ->
    regexIf = /@if \((.*?)\)\s/
    regexElse = /@else/
    regexElif = /@elseif \((.*?)\)\s/
    regexEndif = /@endif/

    last = getLastItemInList()
    lastIndex = 0
    if last
      lastIndex = last.index

    matchIf = regexIf.exec data
    matchElse = regexElse.exec data
    matchElseif = regexElif.exec data
    matchEndif = regexEndif.exec data

    nextStmtObj = null
    nextIndex = Number.POSITIVE_INFINITY
    if matchIf and matchIf.index > lastIndex and matchIf.index < nextIndex
      startIndex = getNextStatementIndex(matchIf.index, data)
      endIndex = getEndNextStatement(matchIf.index, data)
      nextIndex = matchIf.index
      nextStmtObj =
        statement: 'if'
        index: startIndex
        endIndex: endIndex
        buildEnv: matchIf[1]

    if matchElseif and matchElseif.index > lastIndex and matchElseif.index < nextIndex
      startIndex = getNextStatementIndex(matchElseif.index, data)
      endIndex = getEndNextStatement(matchElseif.index, data)
      nextIndex = matchElseif.index
      nextStmtObj =
        statement: 'elseif'
        index: startIndex
        buildEnv: matchElseif[1]
        endIndex: endIndex

    if matchElse and matchElse.index > lastIndex and matchElse.index < nextIndex
      startIndex = getNextStatementIndex(matchElse.index, data)
      endIndex = getEndNextStatement(matchElse.index, data)
      nextIndex = matchElse.index
      nextStmtObj =
        statement: 'else'
        index: startIndex
        endIndex: endIndex

    if matchEndif and matchEndif.index > lastIndex and matchEndif.index < nextIndex
      startIndex = getNextStatementIndex(matchEndif.index, data)
      endIndex = getEndNextStatement(matchEndif.index, data)
      nextIndex = matchEndif.index
      nextStmtObj =
        statement: 'endif'
        index: startIndex
        endIndex: endIndex

    if !nextStmtObj and last
      throw new Error "Malformed brunch preprocess conditional. #{last.statement} statement not closed"

    return nextStmtObj

  getNextStatementIndex = (index, data) ->
    regexEnd = /(?:\n|\r)+.*?$/
    temp = data.substring(0, index)
    matchEnd = regexEnd.exec temp
    if matchEnd?
      return matchEnd.index
    return 0

  getEndNextStatement = (index, data) ->
    regexEnd = /(?:\n|\r)/
    temp = data.substring(index)
    matchEnd = regexEnd.exec temp
    if matchEnd?
      return index + matchEnd.index
    return data.length

  getLastItemInList = ->
    lastIndex = list.length - 1
    if lastIndex >= 0
      return list[lastIndex]
    return null

  buildEnvironmentsMatch = (buildEnv, targetEnv) ->
    if not targetEnv?
      return not buildEnv?
    if not buildEnv?
      return false

    targetEnvs = targetEnv.split('||')
    for targetEnv in targetEnvs
      targetEnv = targetEnv.trim()
      if buildEnv.trim().toLowerCase() is targetEnv.trim().toLowerCase()
        return true

    return false

module.exports = PreProcessor
