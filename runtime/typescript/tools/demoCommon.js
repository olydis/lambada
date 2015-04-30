/// <reference path="jquery.d.ts" />
/// <reference path="IntelliHTML.ts" />
/// <reference path="../asyncRuntimeClient.ts" />
// PERF MAPPING
var layer;
var rtDebugMap = {};
AsyncRuntime.onOpen = function (rt) {
    var debugPanel = $("<div>");
    debugPanel.width(160);
    debugPanel.css("font-family", "monospace");
    debugPanel.css("color", "black");
    debugPanel.css("margin", "5px");
    debugPanel.css("padding", "10px");
    debugPanel.css("background-color", "white");
    debugPanel.css("border-radius", "5px");
    debugPanel.css("overflow", "hidden");
    debugPanel.css("opacity", ".7");
    debugPanel.append($("<br>"));
    layer.append(debugPanel);
    rtDebugMap[rt.uid] = { rt: rt, jq: debugPanel };
};
AsyncRuntime.onClose = function (rt) {
    var jq = rtDebugMap[rt.uid].jq;
    jq.fadeOut(3000, function () { return jq.remove(); });
    delete rtDebugMap[rt.toString()];
};
AsyncRuntime.onPerf = function (rt, data) {
    var jq = rtDebugMap[rt.uid].jq;
    var text = "\n"
        + "\n#apps    " + (data.nApp / 1000000 | 0) + " million"
        + "\n#allocs  " + (data.nAlloc / 1000000 | 0) + " million"
        + "\nhang for " + (data.timeBusy / 1000 | 0) + " seconds";
    jq.text("").append($("<b>").text("Runtime <" + rt.uid + ">"));
    text.split("\n").forEach(function (line) {
        jq.append(line.replace(/ /g, "&nbsp;"));
        jq.append("<br>");
    });
};
$(function () {
    var layer2 = $("<p>");
    layer2.css("position", "absolute");
    layer2.offset({ left: 0, top: 0 });
    layer2.css("width", "100%");
    layer2.css("pointer-events", "none");
    layer = $("<div>");
    layer.css("float", "right");
    layer.css("padding", "20px");
    $("body").append(layer2);
    layer2.append(layer);
});
// END PERF MAPPING
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
