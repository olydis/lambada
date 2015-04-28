/// <reference path="jquery.d.ts" />
/// <reference path="asyncRuntimeClient.ts" />
/// <reference path="IntelliHTML.ts" />
var rt;
var names;
function measure(f) {
    var d1 = new Date().getTime();
    f();
    var d2 = new Date().getTime();
    return d2 - d1;
}
function init(binary) {
    rt = new AsyncRuntime("runtime/typescript/asyncRuntimeServer.js", binary);
    rt.getNames(function (res) { return names = res; });
    rt.onDone(function () { return console.log("Loaded binary (" + binary.length + " bytes)."); });
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
            var printPrelude = function () {
                $("#target").removeClass("dirty error");
                if (binaryBuffer.some(function (x) { return x == null; })) {
                    $("#target").text("no binary ready");
                    return;
                }
                var result = binaryBuffer.join("");
                $("#target").text(result);
                $("#target").addClass("dirty");
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
                    $("#target").removeClass("dirty error");
                }
                catch (e) {
                    $("#target").text(e);
                    $("#target").removeClass("dirty error");
                    $("#target").addClass("error");
                }
            };
            var table = $("<table>");
            sources.forEach(function (src, i) {
                var tr = $("<tr>").appendTo(table);
                var td1 = $("<td>").appendTo(tr);
                var td2 = $("<td>"); //.appendTo(tr);
                var target = $("<pre>").css("word-wrap", "break-word").appendTo(td2);
                var intelliElem = new IntelliHTML(function (text) {
                    intelliElem.element.removeClass("dirty error");
                    intelliElem.element.addClass("dirty");
                    binaryBuffer[i] = null;
                    printPrelude();
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
                        printPrelude();
                    });
                }, function () { return names; });
                intelliElem.text = src;
                td1.append(intelliElem.element.addClass("coll").dblclick(function (eo) { return intelliElem.element.removeClass("coll"); }));
            });
            //var intelliElem = new IntelliHTML(text => $("#target").text(app(d["pipe"], s(text)).asString()));
            //var elem = intelliElem.element;
            //elem.height(512);
            //$("body").prepend(elem);
            //intelliElem.focus();
            $("body").prepend(table);
        });
    });
});
//# sourceMappingURL=runtimeTools.js.map