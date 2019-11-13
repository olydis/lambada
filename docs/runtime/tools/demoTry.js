/// <reference path="demoCommon.ts" />
onReady.push(() => {
    // EVAL PAD
    const safeString = (s) => "[" + s.split("").map(x => x.charCodeAt(0).toString()).join(",") + "]";
    let currentRT = null;
    let debounceHandle = undefined;
    const evalPad = new IntelliHTML(true, text => {
        $("#evalBin").text("").append($("<i>").text("starting compilation shortly (debouncing)..."));
        $("#evalRes").text("").append($("<i>").text("compiling..."));
        clearTimeout(debounceHandle);
        debounceHandle = setTimeout(() => {
            const rtTrash = rtClean.clone();
            if (currentRT != null)
                currentRT.close();
            currentRT = rtTrash;
            localStorage.setItem("fun", text);
            const srcs = splitSources(text);
            let exFree = true;
            const active = (i) => exFree && currentRT == rtTrash && (i == null || i == srcs.length - 1);
            const onEx = (ex) => {
                if (active(null)) {
                    srcs.length = 0;
                    $("#evalRes").text("").append($("<i>").text(ex));
                    exFree = false;
                }
            };
            let totalBinary = "";
            srcs.forEach((text, i) => {
                rtTrash.compile(text, binary => {
                    totalBinary += binary;
                    if (active(null))
                        $("#evalBin").text(totalBinary);
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
    evalPad.text = localStorage.getItem("fun") || `
' LambAda is a lightweight language based entirely on Combinatory Logic
' (the single combinator "Iota" to be precise).
' Beyond that, no concepts or data types are built-in, but instead desugared into CL.

oneHundred = pow 10 2
add 42 oneHundred ' last expression => will be the output of this program

' Check out the lessons and samples above!
`.trim();
    evalPad.focus();
    const populate = (lib) => {
        $.get(libraryPath + lib + ".txt", (data) => {
            var sSpan = $("#" + lib);
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
    };
    populate('samples');
    populate('llessons');
    populate('clessons');
});
