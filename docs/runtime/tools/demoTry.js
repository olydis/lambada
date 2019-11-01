/// <reference path="demoCommon.ts" />
onReady.push(() => {
    // EVAL PAD
    var safeString = (s) => "[" + s.split("").map(x => x.charCodeAt(0).toString()).join(",") + "]";
    var currentRT = null;
    var debounceHandle = undefined;
    var evalPad = new IntelliHTML(true, text => {
        // $("#evalBin").text("").append($("<i>").text("starting compilation shortly (debouncing)..."));
        $("#evalRes").text("").append($("<i>").text("compiling..."));
        clearTimeout(debounceHandle);
        debounceHandle = setTimeout(() => {
            var rtTrash = rtClean.clone();
            if (currentRT != null)
                currentRT.close();
            currentRT = rtTrash;
            localStorage.setItem("fun", text);
            var srcs = splitSources(text);
            var exFree = true;
            var active = (i) => exFree && currentRT == rtTrash && (i == null || i == srcs.length - 1);
            var onEx = (ex) => {
                if (active(null)) {
                    srcs.length = 0;
                    $("#evalRes").text("").append($("<i>").text(ex));
                    exFree = false;
                }
            };
            var totalBinary = "";
            srcs.forEach((text, i) => {
                rtTrash.compile(text, binary => {
                    totalBinary += binary;
                    // if (active(null))
                    //     $("#evalBin").text(totalBinary);
                    if (active(i)) {
                        $("#evalRes").text("").append($("<i>").text("running..."));
                        rtTrash.eval(totalBinary, active(i) ? res => $("#evalRes").text(res) : _ => { }, onEx);
                    }
                }, onEx);
            });
            rtTrash.dumpStats();
            rtTrash.autoClose();
        }, 500);
    }, () => names, $("#evalSrc").css("min-height", "15px"));
    evalPad.text = localStorage.getItem("fun") || "reverse $ listDistinct \"Hallo Welt\" isEQ";
    evalPad.focus();
    $.get(libraryPath + "samples.txt", (data) => {
        var sSpan = $("#samples");
        data.split("~~~").forEach((str, i) => {
            var parts = str.split("~~");
            if (i > 0)
                sSpan.append("&nbsp;&nbsp;&nbsp;");
            sSpan.append($("<a>")
                .text(parts[0].trim())
                .css("cursor", "pointer")
                .click(() => evalPad.text = parts[1].trim()));
        });
    }, "text");
});
//# sourceMappingURL=demoTry.js.map