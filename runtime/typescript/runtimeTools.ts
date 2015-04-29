/// <reference path="jquery.d.ts" />
/// <reference path="asyncRuntimeClient.ts" />
/// <reference path="IntelliHTML.ts" />

var rt: AsyncRuntime;
var names: string[];

function measure(f: () => void)
{
    var d1 = new Date().getTime();
    f();
    var d2 = new Date().getTime();
    return d2 - d1;
}

function init(binary: string) 
{
    rt = new AsyncRuntime("runtime/typescript/asyncRuntimeServer.js", binary);
    rt.getNames(res => names = res);
    rt.onDone(() => console.log("Loaded binary (" + binary.length + " bytes)."));
}

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
                catch (e)
                {
                    $("#target").text(e);
                    $("#target").removeClass("dirty error");
                    $("#target").addClass("error");
                }
            };

            var table = $("#table");
            sources.forEach((src, i) => 
            {
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
                    
                    var parts = splitSources(text);
                    var partBuffers: string[] = [];

                    parts.forEach((part, i) => rt.compile(part, bin => partBuffers[i] = bin));
                    rt.onDone(() =>
                    {
                        var bin = partBuffers.some(x => x == null) ? null : partBuffers.join("");
                        binaryBuffer[i] = bin;
                        target.text(bin);

                        intelliElem.element.removeClass("dirty error");
                        if (bin == null)
                            intelliElem.element.addClass("error");

                        printPrelude();
                    });
                },() => names);
                intelliElem.text = src;
                td1.append(intelliElem.element.css("margin", "0px").addClass("coll").dblclick(eo => intelliElem.element.removeClass("coll")));
            });

            // EVAL PAD

            var evalPad = new IntelliHTML(text => rt.eval(text, res => $("#evalRes").text(res)),() => names, $("#evalSrc").css("min-height", "15px"));
            evalPad.focus();
        });
    });
})