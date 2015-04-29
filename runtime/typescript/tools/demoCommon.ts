/// <reference path="jquery.d.ts" />
/// <reference path="IntelliHTML.ts" />
/// <reference path="../asyncRuntimeClient.ts" />

var libraryPath: string;
var runtimePath: string;

var rtClean: AsyncRuntime;
var names: string[];

function init(binary: string) 
{
    rtClean = new AsyncRuntime(runtimePath + "asyncRuntimeServer.js", binary);
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

var onReady: (() => void)[] = [];

$(function () 
{
    $.get(libraryPath + "prelude.native.txt", (binary: string) =>
    {
        init(binary);
        onReady.forEach(f => f());
    }, "text");
});