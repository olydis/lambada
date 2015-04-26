/// <reference path="jquery.d.ts" />
/// <reference path="runtime.ts" />
/// <reference path="runtimeMinimal.ts" />

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

    $.get("library/prelude.txt", compile, "text");

    console.log("Loaded binary (" + binary.length + " bytes). Ready.");
}

var comp: () => void;
var run: () => void;
var com = (n: number) => { if (n == undefined) n = 100; return measure(() => { while (n-- != 0) comp(); }); };

var runDstart: Date;

function compile(sources: string)
{
    var lines = sources.split("\n");
    var binary = "";
    var index = 0;

    var intervalId = 0;
    comp = () =>
    {
        if (index >= lines.length)
        {
            clearInterval(intervalId);
            console.log(new Date().getTime() - runDstart.getTime());
            document.title = "done";
            init(binary);
        }
        else
        {
            var stmt = lines[index].split("'")[0];
            index++;
            while (index < lines.length && lines[index][0] == " ")
            {
                stmt += lines[index].split("'")[0];
                index++;
            }

            var result = app(
                d["pipe"],
                s(stmt)).asString();

            if (result != "")
            {
                result = result.replace(/\.\s/g, ".").trim();

                document.title = index + " / " + lines.length;
                binary += result;

                $("#target").text($("#target").text() + result);
                window.scrollTo(0, $("#target").height());
                        
                //$("#target").prepend(result + "<br/>");
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
    $.get("library/prelude.native.txt", init, "text");
    var input = $("#input");
    var inputNative = <HTMLInputElement>input[0];
    input.focus();
    input.on("input",() =>
    {
        // extract current identifier
        var v: string = input.val();
        v = v.slice(0, inputNative.selectionStart);
        var vv = /[a-zA-Z_][a-zA-Z0-9_]*$/.exec(v);
        if (vv == null)
            return;
        v = vv[0];

        // extract pixel position
        var tr = inputNative.createTextRange();
        tr.moveStart("character", inputNative.selectionStart);
        document.title = tr.getBoundingClientRect().toString();

        var t = rt.getNames().sort(compareStrings);

        /*
        var index = bsearch(v, t);
        console.log(index);
        t = t.slice(index);
        */

        var resultStart: { x: string; i: number }[] = [];
        var resultAny: { x: string; i: number }[] = [];
        var vLower = v.toLowerCase();
        var vLen = v.length;
        t.forEach(tt =>
        {
            var index = tt.toLowerCase().indexOf(vLower);
            if (index != -1)
                (index == 0 ? resultStart : resultAny).push({ x: tt, i: index });
        });

        Array.prototype.push.apply(resultStart, resultAny);

        $("#target").html(resultStart.map(x => x.x.slice(0, x.i) + "<span style='color: red;'>" + x.x.slice(x.i, x.i + vLen) + "</span>" + x.x.slice(x.i + vLen)).join("<br/>"));
    });
})