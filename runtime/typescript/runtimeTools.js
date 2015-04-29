/// <reference path="jquery.d.ts" />
/// <reference path="asyncRuntimeClient.ts" />
/// <reference path="IntelliHTML.ts" />
var rtClean;
var names;
function init(binary) {
    rtClean = new AsyncRuntime("runtime/typescript/asyncRuntimeServer.js", binary);
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
        js.append($("<a>").text("download binary").click(function () { return window.open("data:;base64," + btoa(binary)); }));
}
$(function () {
    var gPN = $.get("library/prelude.native.txt", undefined, "text");
    var gP = $.get("library/prelude.txt", undefined, "text");
    $.when(gPN, gP).done(function (binary, source) {
        init(binary[0]);
        var preludeParts = source[0].split("\n").map(function (l) { return l.trim(); }).filter(function (l) { return l != "" && l.charAt(0) != "'"; });
        var gPSs = preludeParts.map(function (l) { return $.get("library/" + l, undefined, "text"); });
        $.when.apply($, gPSs).done(function () {
            var sources = [];
            gPSs.forEach(function (x) { return sources.push(x.responseText); });
            // layout
            var binaryBuffer = Array(sources.length).map(function (x) { return null; });
            var d1 = new Date().getTime();
            var detailStats = [];
            var binaryUpdate = function () {
                if (binaryBuffer.some(function (x) { return x == null; })) {
                    statusUpdate("compiling " + binaryBuffer.map(function (x) { return x == null ? "-" : "#"; }).join("") + "\n\n" + detailStats.join("\n"));
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
                    var d2 = new Date().getTime();
                    var compMS = d2 - d1;
                    statusUpdate("binary ready and healthy (" + result.length + " bytes, compiled in " + (compMS / 1000).toFixed(3) + "s)" + "\n\n" + detailStats.join("\n"), null, result);
                }
                catch (e) {
                    statusUpdate(e, "error");
                }
            };
            var rtCompilePrelude = rtClean.clone();
            var table = $("#table");
            var dc1 = new Date().getTime();
            sources.forEach(function (src, i) {
                detailStats[i] = "    " + preludeParts[i] + ": ";
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
                    parts.forEach(function (part, i) { return rtCompilePrelude.compile(part, function (bin) { return partBuffers[i] = bin; }); });
                    rtCompilePrelude.onDone(function () {
                        var bin = partBuffers.some(function (x) { return x == null; }) ? null : partBuffers.join("");
                        binaryBuffer[i] = bin;
                        target.text(bin);
                        if (bin != null) {
                            var dc2 = new Date().getTime();
                            detailStats[i] += (dc2 - dc1).toString() + "ms";
                            dc1 = dc2;
                        }
                        intelliElem.element.removeClass("dirty error");
                        if (bin == null)
                            intelliElem.element.addClass("error");
                        binaryUpdate();
                    });
                }, function () { return names; });
                intelliElem.text = src;
                td1.append(intelliElem.element.css("margin", "0px").addClass("coll").dblclick(function (eo) { return intelliElem.element.removeClass("coll"); }));
            });
            rtCompilePrelude.autoClose();
            // EVAL PAD
            var safeString = function (s) { return "[" + s.split("").map(function (x) { return x.charCodeAt(0).toString(); }).join(",") + "]"; };
            var currentRT = null;
            var debounceHandle = undefined;
            var evalPad = new IntelliHTML(function (text) {
                $("#evalRes").text("").append($("<i>").text("pending..."));
                $("#evalDebug").text("").append($("<i>").text("pending..."));
                clearTimeout(debounceHandle);
                debounceHandle = setTimeout(function () {
                    var rtTrash = rtClean.clone();
                    currentRT = rtTrash;
                    localStorage.setItem("fun", text);
                    var srcs = splitSources(text);
                    var onEx = function (ex) {
                        if (currentRT == rtTrash) {
                            srcs.length = 0;
                            $("#evalRes").text("").append($("<i>").text(ex));
                        }
                    };
                    srcs.forEach(function (text, i) {
                        rtTrash.compile(text, function (binary) { return rtTrash.eval(binary, i < srcs.length - 1 || currentRT != rtTrash ? function (_) {
                        } : function (res) { return $("#evalRes").text(res); }, onEx); }, onEx);
                        rtTrash.compile("fullDebug " + safeString(text), function (binary) { return rtTrash.eval(binary, i < srcs.length - 1 || currentRT != rtTrash ? function (_) {
                        } : function (res) { return $("#evalDebug").text(res); }, onEx); }, onEx);
                    });
                    rtTrash.autoClose();
                }, 500);
            }, function () { return names; }, $("#evalSrc").css("min-height", "15px"));
            evalPad.text = localStorage.getItem("fun") || "reverse $ listDistinct \"Hallo Welt\" isEQ";
            evalPad.focus();
            $.get("library/samples.txt", function (data) {
                var sSpan = $("#samples");
                data.split("---").forEach(function (str) {
                    var parts = str.split("--");
                    sSpan.append("&nbsp;&nbsp;&nbsp;");
                    sSpan.append($("<a>").text(parts[0].trim()).click(function () { return evalPad.text = parts[1].trim(); }));
                });
            }, "text");
        });
    });
});
//# sourceMappingURL=runtimeTools.js.map