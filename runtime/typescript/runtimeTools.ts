/// <reference path="jquery.d.ts" />
/// <reference path="asyncRuntimeClient.ts" />
/// <reference path="IntelliHTML.ts" />

var rtClean: AsyncRuntime;
var names: string[];

function init(binary: string) 
{
    rtClean = new AsyncRuntime("runtime/typescript/asyncRuntimeServer.js", binary);
    rtClean.getNames(res => names = res);
    rtClean.onDone(() => console.log("Loaded binary (" + binary.length + " bytes)."));
    rtClean.autoClose();
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

function statusUpdate(message: string, status: string = null, binary: string = null)
{
    var js = $("#status");
    js.text("Status: " + message + "\n\n");
    js.off("click");
    js.removeClass("dirty error");
    if (status != null)
        js.addClass(status);

    if (binary != null)
        js.append($("<a>").text("download binary").click(() => window.open("data:;base64," + btoa(binary))));
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

            var d1 = new Date().getTime();
            var binaryUpdate = () =>
            {
                if (binaryBuffer.some(x => x == null))
                {
                    statusUpdate("compiling " + binaryBuffer.map(x => x == null ? "-" : "#").join(""));
                    return;
                }

                var result = binaryBuffer.join("");
                // CLICK ON
                statusUpdate("testing binary", "dirty");
                
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
                    var d2 = new Date().getTime();
                    var compMS = d2 - d1;
                    statusUpdate("binary ready and healthy (" + result.length + " bytes, compiled in " + (compMS / 1000).toFixed(3) + "s)", null, result);
                }
                catch (e)
                {
                    statusUpdate(e, "error");
                }
            };

            var rtCompilePrelude = rtClean.clone();

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
                    binaryUpdate();
                    
                    var parts = splitSources(text);
                    var partBuffers: string[] = [];

                    parts.forEach((part, i) => rtCompilePrelude.compile(part, bin => partBuffers[i] = bin));
                    rtCompilePrelude.onDone(() =>
                    {
                        var bin = partBuffers.some(x => x == null) ? null : partBuffers.join("");
                        binaryBuffer[i] = bin;
                        target.text(bin);

                        intelliElem.element.removeClass("dirty error");
                        if (bin == null)
                            intelliElem.element.addClass("error");

                        binaryUpdate();
                    });
                },() => names);
                intelliElem.text = src;
                td1.append(intelliElem.element.css("margin", "0px").addClass("coll").dblclick(eo => intelliElem.element.removeClass("coll")));
            });
            rtCompilePrelude.autoClose();

            // EVAL PAD

            var safeString = (s: string) => "[" + s.split("").map(x => x.charCodeAt(0).toString()).join(",") + "]";

            var currentRT: AsyncRuntime = null;
            var debounceHandle: number = undefined;
            var evalPad = new IntelliHTML(text => 
            {
                $("#evalRes").text("").append($("<i>").text("pending..."));
                $("#evalDebug").text("").append($("<i>").text("pending..."));

                clearTimeout(debounceHandle);
                debounceHandle = setTimeout(() =>
                {
                    var rtTrash = rtClean.clone();
                    currentRT = rtTrash;
                    localStorage.setItem("fun", text);
                    var srcs = splitSources(text);

                    var onEx = (ex: any) =>
                    {
                        if (currentRT == rtTrash)
                        {
                            srcs.length = 0;
                            $("#evalRes").text("").append($("<i>").text(ex));
                        }
                    };

                    srcs.forEach((text, i) =>
                    {
                        rtTrash.compile(text,
                            binary => rtTrash.eval(binary, i < srcs.length - 1 || currentRT != rtTrash ? _ => { } : res => $("#evalRes").text(res), onEx),
                            onEx);
                        rtTrash.compile("fullDebug " + safeString(text),
                            binary => rtTrash.eval(binary, i < srcs.length - 1 || currentRT != rtTrash ? _ => { } : res => $("#evalDebug").text(res), onEx),
                            onEx);
                    });
                    rtTrash.autoClose();
                }, 500);
            },() => names, $("#evalSrc").css("min-height", "15px"));
            evalPad.text = localStorage.getItem("fun") || "reverse $ listDistinct \"Hallo Welt\" isEQ";
            evalPad.focus();

            $.get("library/samples.txt",(data: string) =>
            {
                var sSpan = $("#samples");
                data.split("---").forEach(str =>
                {
                    var parts = str.split("--");
                    sSpan.append("&nbsp;&nbsp;&nbsp;");
                    sSpan.append($("<a>").text(parts[0].trim()).click(() => evalPad.text = parts[1].trim()));
                });
            }, "text");
        });
    });
})