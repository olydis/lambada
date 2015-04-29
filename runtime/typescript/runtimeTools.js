/// <reference path="jquery.d.ts" />
/// <reference path="asyncRuntimeClient.ts" />
/// <reference path="IntelliHTML.ts" />
var rt;
var rt2;
var names;
function init(binary) {
    rt = new AsyncRuntime("runtime/typescript/asyncRuntimeServer.js", binary);
    rt.getNames(function (res) { return names = res; });
    rt.onDone(function () { return console.log("Loaded binary (" + binary.length + " bytes)."); });
    rt2 = rt.clone();
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
function statusUpdate(message, status, binary) {
    if (status === void 0) { status = null; }
    if (binary === void 0) { binary = null; }
    var js = $("#status");
    js.text("Status: " + message + "\n\n");
    js.off("click");
    js.removeClass("dirty error");
    if (status != null)
        js.addClass(status);
    if (binary != null)
        js.append($("<a>").text("download binary").css("cursor", "pointer").click(function () { return window.open("data:;base64," + btoa(binary)); }));
}
$(function () {
    var gPN = $.get("library/prelude.native.txt", undefined, "text");
    var gP = $.get("library/prelude.txt", undefined, "text");
    $.when(gPN, gP).done(function (binary, source) {
        init(binary[0]);
        var gPSs = source[0].split("\n").map(function (l) { return l.trim(); }).filter(function (l) { return l != "" && l.charAt(0) != "'"; }).map(function (l) { return $.get("library/" + l, undefined, "text"); });
        $.when.apply($, gPSs).done(function () {
            var sources = [];
            gPSs.forEach(function (x) { return sources.push(x.responseText); });
            // layout
            var binaryBuffer = Array(sources.length).map(function (x) { return null; });
            var binaryUpdate = function () {
                if (binaryBuffer.some(function (x) { return x == null; })) {
                    statusUpdate("no binary available (yet)");
                    return;
                }
                var result = binaryBuffer.join("");
                // CLICK ON
                statusUpdate("testing binary", "dirty");
                try {
                    var testRuntime = LambadaRuntime.Runtime.create(result);
                    //var d = (<any>rt).defs;
                    //var tc = d["testCount"].asNumber();
                    //var dddiff = measure(() =>
                    //{
                    //    for (var i = 0; i < tc; i++)
                    //    {
                    //        var prop = "test" + i;
                    //        var succ: boolean;
                    //        var ddiff = measure(() => { succ = app(d["strFromB"], d[prop]).asString() != "True"; });
                    //        if (succ)
                    //            throw prop + " failed";
                    //    }
                    //});
                    statusUpdate("binary ready and healthy (" + result.length + " bytes)", null, result);
                }
                catch (e) {
                    statusUpdate(e, "error");
                }
            };
            var table = $("#table");
            sources.forEach(function (src, i) {
                var tr = $("<tr>").appendTo(table);
                var td1 = $("<td>").appendTo(tr);
                var td2 = $("<td>"); //.appendTo(tr);
                var target = $("<pre>").css("word-wrap", "break-word").appendTo(td2);
                var intelliElem = new IntelliHTML(function (text) {
                    intelliElem.element.removeClass("dirty error");
                    intelliElem.element.addClass("dirty");
                    binaryBuffer[i] = null;
                    binaryUpdate();
                    var parts = splitSources(text);
                    var partBuffers = [];
                    parts.forEach(function (part, i) { return rt.compile(part, function (bin) { return partBuffers[i] = bin; }); });
                    rt.onDone(function () {
                        var bin = partBuffers.some(function (x) { return x == null; }) ? null : partBuffers.join("");
                        binaryBuffer[i] = bin;
                        target.text(bin);
                        intelliElem.element.removeClass("dirty error");
                        if (bin == null)
                            intelliElem.element.addClass("error");
                        binaryUpdate();
                    });
                }, function () { return names; });
                intelliElem.text = src;
                td1.append(intelliElem.element.css("margin", "0px").addClass("coll").dblclick(function (eo) { return intelliElem.element.removeClass("coll"); }));
            });
            // EVAL PAD
            var safeString = function (s) { return "[" + s.split("").map(function (x) { return x.charCodeAt(0).toString(); }).join(",") + "]"; };
            var evalPad = new IntelliHTML(function (text) {
                localStorage.setItem("fun", text);
                rt2.compile(text, function (binary) { return rt2.eval(binary, function (res) { return $("#evalRes").text(res); }); });
                rt2.compile("fullDebug " + safeString(text), function (binary) { return rt2.eval(binary, function (res) { return $("#evalDebug").text(res); }); });
            }, function () { return names; }, $("#evalSrc").css("min-height", "15px"));
            evalPad.text = localStorage.getItem("fun") || "reverse $ listDistinct \"Hallo Welt\" isEQ";
            evalPad.focus();
        });
    });
});
//# sourceMappingURL=runtimeTools.js.map