/// <reference path="jquery.d.ts" />
/// <reference path="runtime.ts" />
/// <reference path="runtimeMinimal.ts" />
/// <reference path="IntelliHTML.ts" />

//var lrt = LambadaRuntimeMinimal;
var lrt = LambadaRuntime;

function measure(f: () => void)
{
    var d1 = new Date().getTime();
    f();
    var d2 = new Date().getTime();
    return d2 - d1;
}

var rt: LambadaRuntime.Runtime;

var app: (...expressions: LambadaRuntime.ExpressionBase[]) => LambadaRuntime.ExpressionBase;
var d: { [name: string]: any };
var s: (s: string) => LambadaRuntime.ExpressionBase;
var n: (n: number) => LambadaRuntime.ExpressionBase;
var stats: (cnt: number) => string;
var rstats: () => void;

function runTests()
{
    // automated
    var tc = d["testCount"].asNumber();
    var dddiff = measure(() =>
    {
        for (var i = 0; i < tc; i++)
        {
            var prop = "test" + i;
            var succ: boolean;
            var ddiff = measure(() => { succ = app(d["strFromB"], d[prop]).asString() != "True"; });
            if (succ)
                throw prop + " failed";
            //else
            //    console.log(prop + " passed in " + ddiff + "ms");
        }
    });
    console.log(tc + " tests passed in " + dddiff + "ms");
            
    // execution speed (1.000.000 x operation)
    // K
    var kTest = d["k"];
    for (var i = 0; i < 1000000 * 2; i++)
        kTest = app(kTest, d["k"]);
    console.log("K: " + measure(() => kTest.fullReduce()) + "ms");
}

function init(binary: string) 
{
    rt = lrt.Runtime.create(binary);

    d = (<any>rt).defs;
    app = lrt.Expression.createApplicationx;
    s = lrt.ShortcutExpression.createString;
    n = lrt.ShortcutExpression.createNumber;
            
    //runTests();
            
    stats = (cnt: number) =>
    {
        if (cnt == undefined) cnt = 10;
        var x: LambadaRuntime.ExpressionBase[] = [];
        for (var prop in d) x.push(d[prop]);
        x = x.sort((a, b) => (<any>b).called - (<any>a).called);
        return x.slice(0, cnt).map(y => "{ n: " + (<any>y).alias + ", " + "c: " + (<any>y).called + " }").join("\n");
    };
    rstats = () => { for (var prop in d) d[prop].called = 0; };

    console.log("Loaded binary (" + binary.length + " bytes). Ready.");
}

var comp: () => void;
var run: () => void;
var com = (n: number) => { if (n == undefined) n = 100; return measure(() => { while (n-- != 0) comp(); }); };

var runDstart: Date;

function splitSources(sources: string): string[]
{
    var result: string[] = [];

    var lines = sources.split("\n");
    var index = 0;

    while (index < lines.length)
    {
        var stmt = lines[index].split("'")[0];
        index++;
        while (index < lines.length && lines[index][0] == " ")
        {
            stmt += "\n" + lines[index].split("'")[0];
            index++;
        }
        if (stmt.trim() != "")
            result.push(stmt);
    }

    return result;
}
function compile(sources: string[])
{
    var binary = "";
    var index = 0;

    var intervalId = 0;
    comp = () =>
    {
        if (index >= sources.length)
        {
            clearInterval(intervalId);
            console.log(new Date().getTime() - runDstart.getTime());
            document.title = "done";
            init(binary);
        }
        else
        {
            var stmt = sources[index];
            index++;

            var result = app(
                d["pipe"],
                s(stmt)).asString();

            if (result != "")
            {
                result = result.replace(/\.\s/g, ".").trim();

                document.title = index + " / " + sources.length;
                binary += result;

                $("#target").text($("#target").text() + result);
                window.scrollTo(0, $("#target").height());
            }
        }
    };
    run = () =>
    {
        $("#target").empty();
        runDstart = new Date(); intervalId = setInterval(comp, 1);
    };
}

function leval(expr: string)
{
    return app(
        d["maybeTryGetValue"],
        app(d["run2"], rt, s(expr)),
        s("error"));
}
function exec(expr: string)
{
    var result = leval(expr);
    result.fullReduce();
    return result.toString();
}

function debug(expr: LambadaRuntime.ExpressionBase)
{
    console.log(expr.toString());
    while (expr.reduce())
        console.log(expr.toString());
}

var compareStrings = (a: string, b: string) => a.toLowerCase() <= b.toLowerCase() ? -1 : 1;

function bsearch(x: string, xs: string[]): number
{
    var s = -1;
    var e = xs.length;
    while (s < e - 1)
    {
        var m = (s + e) / 2 | 0;
        var res = compareStrings(x, xs[m]);
        if (res < 0)
            e = m;
        else
            s = m;
    }
    return s + 1;
}

$(function () 
{
    var gPN = $.get("library/prelude.native.txt", undefined, "text");
    var gP = $.get("library/prelude.txt", undefined, "text");

    $.when(gPN, gP).done((binary: [string, string, any], source: [string, string, any]) =>
    {
        init(binary[0]);

        var gPSs = source[0]
            .split("\n")
            .map(l => l.trim())
            .filter(l => l != "" && l.charAt(0) != "'")
            .map(l => $.get("library/" + l, undefined, "text"));
        $.when.apply($, gPSs).done(() =>
        {
            var sources: string[] = [];
            gPSs.forEach(x => sources.push(x.responseText));

            // layout

            var binaryBuffer: string[] = Array<string>(sources.length).map(x => null);

            var printPrelude = () =>
            {
                $("#target").removeClass("dirty error");
                if (binaryBuffer.some(x => x == null))
                {
                    $("#target").text("no binary ready");
                    return;
                }

                var result = binaryBuffer.join("");
                $("#target").text(result);
                $("#target").addClass("dirty");

                // TEST BINARY
                try
                {
                    var testRuntime = LambadaRuntime.Runtime.create(result);
                    var d = (<any>rt).defs;
                    var tc = d["testCount"].asNumber();
                    var dddiff = measure(() =>
                    {
                        for (var i = 0; i < tc; i++)
                        {
                            var prop = "test" + i;
                            var succ: boolean;
                            var ddiff = measure(() => { succ = app(d["strFromB"], d[prop]).asString() != "True"; });
                            if (succ)
                                throw prop + " failed";
                        }
                    });
                    $("#target").removeClass("dirty error");
                }
                catch (e)
                {
                    $("#target").text(e);
                    $("#target").removeClass("dirty error");
                    $("#target").addClass("error");
                }
            };

            var table = $("<table>");
            sources.forEach((src, i) => 
            {
                var schedule: (() => void)[] = [];

                var tr = $("<tr>").appendTo(table);
                var td1 = $("<td>").appendTo(tr);
                var td2 = $("<td>");//.appendTo(tr);

                var target = $("<pre>").css("word-wrap", "break-word").appendTo(td2);
                var intelliElem = new IntelliHTML(text =>
                {
                    intelliElem.element.removeClass("dirty error");
                    intelliElem.element.addClass("dirty");
                    binaryBuffer[i] = null;
                    printPrelude();
                    schedule.length = 0;
                    
                    var parts = splitSources(text);
                    var partBuffers: string[] = [];

                    parts.forEach((part, i) =>
                    {
                        schedule.push(() =>
                        {
                            var bin = app(d["pipe"], s(part)).asString().replace(/\.\s/g, ".").trim();
                            bin = bin.trim() == "" ? null : bin;
                            partBuffers[i] = bin;
                        });
                    });
                    schedule.push(() =>
                    {
                        var bin = partBuffers.some(x => x == null) ? null : partBuffers.join("");
                        binaryBuffer[i] = bin;
                        target.text(bin);

                        intelliElem.element.removeClass("dirty error");
                        if (bin == null)
                            intelliElem.element.addClass("error");
                    });
                    schedule.push(() => printPrelude());
                });
                intelliElem.text = src;
                td1.append(intelliElem.element.addClass("coll").dblclick(eo => intelliElem.element.removeClass("coll")));

                setInterval(() => { if (schedule.length > 0) schedule.shift()(); }, 100);
            });

            //var intelliElem = new IntelliHTML(text => $("#target").text(app(d["pipe"], s(text)).asString()));
            //var elem = intelliElem.element;
            //elem.height(512);

            //$("body").prepend(elem);
            //intelliElem.focus();

            $("body").prepend(table);
        });
    });
})