/// <reference path="demoCommon.ts" />
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
onReady.push(function () {
    $.get(libraryPath + "prelude.txt", function (source) {
        var preludeParts = source
            .split("\n")
            .map(function (l) { return l.trim(); })
            .filter(function (l) { return l != "" && l.charAt(0) != "'"; });
        var gPSs = preludeParts.map(function (l) { return $.get(libraryPath + l, function () { }, "text"); });
        $.when.apply($, gPSs).done(function () {
            var sources = [];
            gPSs.forEach(function (x) { return sources.push(x.responseText); });
            // layout
            var binaryBuffer = Array(sources.length).map(function (x) { return null; });
            var d1 = new Date().getTime();
            var detailStats = [];
            var binaryUpdate = function () {
                if (binaryBuffer.some(function (x) { return x == null; })) {
                    statusUpdate("compiling " + binaryBuffer.map(function (x) { return x == null ? "-" : "#"; }).join("")
                        + "\n\n" + detailStats.join("\n"));
                    return;
                }
                var result = binaryBuffer.join("");
                // CLICK ON
                statusUpdate("testing binary", "dirty");
                // TEST BINARY
                try {
                    //var testRuntime = LambadaRuntime.Runtime.create(result);
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
                    statusUpdate("binary ready and healthy (" + result.length + " bytes, compiled in " + (compMS / 1000).toFixed(3) + "s)"
                        + "\n\n" + detailStats.join("\n"), null, result);
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
                var intelliElem = new IntelliHTML(false, function (text) {
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
        });
    }, "text");
});
//# sourceMappingURL=demoCompile.js.map