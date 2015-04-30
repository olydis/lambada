/// <reference path="jquery.d.ts" />
/// <reference path="IntelliHTML.ts" />
/// <reference path="../asyncRuntimeClient.ts" />
var libraryPath;
var runtimePath;
var rtClean;
var names;
function init(binary) {
    rtClean = new AsyncRuntime(runtimePath + "asyncRuntimeServer.js", binary);
    rtClean.getNames(function (res) { return names = res; });
    rtClean.onDone(function () { return console.log("Loaded binary (" + binary.length + " bytes)."); });
    rtClean.autoClose();
}
function splitSources(sources) {
    var result = [];
    var lines = sources.split("\n");
    var index = 0;
    while (index < lines.length) {
        var stmt = lines[index].split("'")[0];
        index++;
        while (index < lines.length && lines[index][0] == " ") {
            stmt += "\n" + lines[index].split("'")[0];
            index++;
        }
        if (stmt.trim() != "")
            result.push(stmt);
    }
    return result;
}
var compareStrings = function (a, b) { return a.toLowerCase() <= b.toLowerCase() ? -1 : 1; };
function bsearch(x, xs) {
    var s = -1;
    var e = xs.length;
    while (s < e - 1) {
        var m = (s + e) / 2 | 0;
        var res = compareStrings(x, xs[m]);
        if (res < 0)
            e = m;
        else
            s = m;
    }
    return s + 1;
}
var onReady = [];
$(function () {
    $.get(libraryPath + "prelude.native.txt", function (binary) {
        init(binary);
        onReady.forEach(function (f) { return f(); });
    }, "text");
});
