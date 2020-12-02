/// <reference path="demoCommon.ts" />
function statusUpdate(message, status = null, binary = null) {
    let js = $("#status");
    js.text("Status: " + message + "\n\n");
    js.off("click");
    js.removeClass("dirty error");
    if (status != null)
        js.addClass(status);
    if (binary != null)
        js.append($("<a>").text("download binary").click(() => window.open("data:;base64," + btoa(binary))));
}
onReady.push(() => {
    $.get(libraryPath + "prelude.txt", (source) => {
        let preludeParts = source
            .split("\n")
            .map(l => l.trim())
            .filter(l => l != "" && l.charAt(0) != "'");
        let gPSs = preludeParts.map(l => $.get(libraryPath + l, () => { }, "text"));
        $.when.apply($, gPSs).done(() => {
            let sources = [];
            gPSs.forEach(x => sources.push(x.responseText));
            // layout
            let binaryBuffer = Array(sources.length).map(x => null);
            let d1 = new Date().getTime();
            let detailStats = [];
            let binaryUpdate = () => {
                if (binaryBuffer.some(x => x == null)) {
                    statusUpdate("compiling " + binaryBuffer.map(x => x == null ? "-" : "#").join("")
                        + "\n\n" + detailStats.join("\n"));
                    return;
                }
                let result = binaryBuffer.join("");
                // CLICK ON
                statusUpdate("testing binary", "dirty");
                // TEST BINARY
                try {
                    //let testRuntime = LambadaRuntime.Runtime.create(result);
                    //let d = (<any>rt).defs;
                    //let tc = d["testCount"].asNumber();
                    //let dddiff = measure(() =>
                    //{
                    //    for (let i = 0; i < tc; i++)
                    //    {
                    //        let prop = "test" + i;
                    //        let succ: boolean;
                    //        let ddiff = measure(() => { succ = app(d["strFromB"], d[prop]).asString() != "True"; });
                    //        if (succ)
                    //            throw prop + " failed";
                    //    }
                    //});
                    let d2 = new Date().getTime();
                    let compMS = d2 - d1;
                    statusUpdate("binary ready and healthy (" + result.length + " bytes, compiled in " + (compMS / 1000).toFixed(3) + "s)"
                        + "\n\n" + detailStats.join("\n"), null, result);
                }
                catch (e) {
                    statusUpdate(e, "error");
                }
            };
            let rtCompilePrelude = rtClean.clone();
            let table = $("#table");
            let dc1 = new Date().getTime();
            sources.forEach((src, i) => {
                detailStats[i] = "    " + preludeParts[i] + ": ";
                let tr = $("<tr>").appendTo(table);
                let td1 = $("<td>").appendTo(tr);
                let td2 = $("<td>"); //.appendTo(tr);
                let target = $("<pre>").css("word-wrap", "break-word").appendTo(td2);
                let intelliElem = new IntelliHTML(false, text => {
                    intelliElem.element.removeClass("dirty error");
                    intelliElem.element.addClass("dirty");
                    binaryBuffer[i] = null;
                    binaryUpdate();
                    let parts = splitSources(text);
                    let partBuffers = [];
                    parts.forEach((part, i) => rtCompilePrelude.compile(part, bin => partBuffers[i] = bin));
                    rtCompilePrelude.onDone(() => {
                        let bin = partBuffers.some(x => x == null) ? null : partBuffers.join("");
                        binaryBuffer[i] = bin;
                        target.text(bin || '');
                        if (bin != null) {
                            let dc2 = new Date().getTime();
                            detailStats[i] += (dc2 - dc1).toString() + "ms";
                            dc1 = dc2;
                        }
                        intelliElem.element.removeClass("dirty error");
                        if (bin == null)
                            intelliElem.element.addClass("error");
                        binaryUpdate();
                    });
                }, () => names);
                intelliElem.text = src;
                td1.append(intelliElem.element.css("margin", "0px").addClass("coll").dblclick(eo => intelliElem.element.removeClass("coll")));
            });
            rtCompilePrelude.autoClose();
        });
    }, "text");
});
