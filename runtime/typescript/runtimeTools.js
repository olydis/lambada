/// <reference path="jquery.d.ts" />
/// <reference path="runtime.ts" />
/// <reference path="runtimeMinimal.ts" />
/// <reference path="IntelliHTML.ts" />
//var lrt = LambadaRuntimeMinimal;
var lrt = LambadaRuntime;
function measure(f) {
    var d1 = new Date().getTime();
    f();
    var d2 = new Date().getTime();
    return d2 - d1;
}
var rt;
var app;
var d;
var s;
var n;
var stats;
var rstats;
function runTests() {
    // automated
    var tc = d["testCount"].asNumber();
    var dddiff = measure(function () {
        for (var i = 0; i < tc; i++) {
            var prop = "test" + i;
            var succ;
            var ddiff = measure(function () {
                succ = app(d["strFromB"], d[prop]).asString() != "True";
            });
            if (succ)
                throw prop + " failed";
        }
    });
    console.log(tc + " tests passed in " + dddiff + "ms");
    // execution speed (1.000.000 x operation)
    // K
    var kTest = d["k"];
    for (var i = 0; i < 1000000 * 2; i++)
        kTest = app(kTest, d["k"]);
    console.log("K: " + measure(function () { return kTest.fullReduce(); }) + "ms");
}
function init(binary) {
    rt = lrt.Runtime.create(binary);
    d = rt.defs;
    app = lrt.Expression.createApplicationx;
    s = lrt.ShortcutExpression.createString;
    n = lrt.ShortcutExpression.createNumber;
    //runTests();
    stats = function (cnt) {
        if (cnt == undefined)
            cnt = 10;
        var x = [];
        for (var prop in d)
            x.push(d[prop]);
        x = x.sort(function (a, b) { return b.called - a.called; });
        return x.slice(0, cnt).map(function (y) { return "{ n: " + y.alias + ", " + "c: " + y.called + " }"; }).join("\n");
    };
    rstats = function () {
        for (var prop in d)
            d[prop].called = 0;
    };
    console.log("Loaded binary (" + binary.length + " bytes). Ready.");
}
var comp;
var run;
var com = function (n) {
    if (n == undefined)
        n = 100;
    return measure(function () {
        while (n-- != 0)
            comp();
    });
};
var runDstart;
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
function compile(sources) {
    var binary = "";
    var index = 0;
    var intervalId = 0;
    comp = function () {
        if (index >= sources.length) {
            clearInterval(intervalId);
            console.log(new Date().getTime() - runDstart.getTime());
            document.title = "done";
            init(binary);
        }
        else {
            var stmt = sources[index];
            index++;
            var result = app(d["pipe"], s(stmt)).asString();
            if (result != "") {
                result = result.replace(/\.\s/g, ".").trim();
                document.title = index + " / " + sources.length;
                binary += result;
                $("#target").text($("#target").text() + result);
                window.scrollTo(0, $("#target").height());
            }
        }
    };
    run = function () {
        $("#target").empty();
        runDstart = new Date();
        intervalId = setInterval(comp, 1);
    };
}
function leval(expr) {
    return app(d["maybeTryGetValue"], app(d["run2"], rt, s(expr)), s("error"));
}
function exec(expr) {
    var result = leval(expr);
    result.fullReduce();
    return result.toString();
}
function debug(expr) {
    console.log(expr.toString());
    while (expr.reduce())
        console.log(expr.toString());
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
                    var d = rt.defs;
                    var tc = d["testCount"].asNumber();
                    var dddiff = measure(function () {
                        for (var i = 0; i < tc; i++) {
                            var prop = "test" + i;
                            var succ;
                            var ddiff = measure(function () {
                                succ = app(d["strFromB"], d[prop]).asString() != "True";
                            });
                            if (succ)
                                throw prop + " failed";
                        }
                    });
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
                var schedule = [];
                var tr = $("<tr>").appendTo(table);
                var td1 = $("<td>").appendTo(tr);
                var td2 = $("<td>"); //.appendTo(tr);
                var target = $("<pre>").css("word-wrap", "break-word").appendTo(td2);
                var intelliElem = new IntelliHTML(function (text) {
                    intelliElem.element.removeClass("dirty error");
                    intelliElem.element.addClass("dirty");
                    binaryBuffer[i] = null;
                    printPrelude();
                    schedule.length = 0;
                    var parts = splitSources(text);
                    var partBuffers = [];
                    parts.forEach(function (part, i) {
                        schedule.push(function () {
                            var bin = app(d["pipe"], s(part)).asString().replace(/\.\s/g, ".").trim();
                            bin = bin.trim() == "" ? null : bin;
                            partBuffers[i] = bin;
                        });
                    });
                    schedule.push(function () {
                        var bin = partBuffers.some(function (x) { return x == null; }) ? null : partBuffers.join("");
                        binaryBuffer[i] = bin;
                        target.text(bin);
                        intelliElem.element.removeClass("dirty error");
                        if (bin == null)
                            intelliElem.element.addClass("error");
                    });
                    schedule.push(function () { return printPrelude(); });
                });
                intelliElem.text = src;
                td1.append(intelliElem.element.addClass("coll").dblclick(function (eo) { return intelliElem.element.removeClass("coll"); }));
                setInterval(function () {
                    if (schedule.length > 0)
                        schedule.shift()();
                }, 100);
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