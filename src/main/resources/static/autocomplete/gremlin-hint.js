// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("bower_components/codemirror/lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["bower_components/codemirror/lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  var Pos = CodeMirror.Pos;

  function forEach(arr, f) {
    for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
  }

  function arrayContains(arr, item) {
    if (!Array.prototype.indexOf) {
      var i = arr.length;
      while (i--) {
        if (arr[i] === item) {
          return true;
        }
      }
      return false;
    }
    return arr.indexOf(item) != -1;
  }

  function scriptHint(editor, keywords, getToken, options) {
    // Find the token at the cursor
    var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;
    // If it's not a 'word-style' token, ignore the token.

//    if (!/^[\w$_]*$/.test(token.string)) {
//        token = tprop = {start: cur.ch, end: cur.ch, string: "", state: token.state,
//                         className: token.string == ":" ? "variable" : null};
//    }

    if (!context) var context = [];
    context.push(tprop);

    var completionList = getCompletions(token, context);
    completionList = completionList.sort();

    return {list: completionList,
            from: CodeMirror.Pos(cur.line, token.start),
            to: CodeMirror.Pos(cur.line, token.end)};
  }

  function gremlinHint(editor, options) {
    return scriptHint(editor, gremlinKeywords,
                      function (e, cur) {
                        return e.getTokenAt(cur);
                      },
                      options);
  };
  CodeMirror.registerHelper("hint", "gremlin", gremlinHint);

  var gremlinKeywords = "has as back out in outE inE both bothE bothV cap gather inV memoize order outV path scatter shuffle and back dedup except filter hasNot interval or random retain simplePath copySplit exhaustMerge fairMerge ifThenElse loop".split(" ")
  var gremlinKeywordsWithDot = ".has .as .back .out .in .outE .inE .both .bothE .bothV .cap .gather .inV .memoize .order .outV .path .scatter .shuffle .and .back .dedup .except .filter .hasNot .interval .or .random .retain .simplePath .copySplit .exhaustMerge .fairMerge .ifThenElse .loop".split(" ")

  function getCompletions(token, context) {
      var found = [], start = token.string;

      function maybeAdd(str) {
        if (str.lastIndexOf(start, 0) == 0 && !arrayContains(found, str)) found.push(str);
      }

      function gatherCompletions(prefix) {
          forEach(gremlinKeywords, maybeAdd);
          forEach(gremlinKeywordsWithDot, maybeAdd);
      }

      if (context) {
        var obj = context.pop();
        if (obj.type == ".")
            gatherCompletions();
        if (obj.type == "property")
            gatherCompletions();
      }
      return found;
  }
});
