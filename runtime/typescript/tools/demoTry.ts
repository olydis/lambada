/// <reference path="demoCommon.ts" />

onReady.push(() => {
    // EVAL PAD
    const safeString = (s: string) => "[" + s.split("").map(x => x.charCodeAt(0).toString()).join(",") + "]";

    let currentRT: AsyncRuntime = null;
    let debounceHandle: number = undefined;
    const evalPad = new IntelliHTML(true, text => {
        $("#evalBin").text("").append($("<i>").text("starting compilation shortly (debouncing)..."));
        $("#evalRes").text("").append($("<i>").text("compiling..."));

        clearTimeout(debounceHandle);
        debounceHandle = setTimeout(() => {
            const rtTrash = rtClean.clone();
            if (currentRT != null) currentRT.close();
            currentRT = rtTrash;
            localStorage.setItem("fun", text);
            const srcs = splitSources(text);

            let exFree = true;
            const active = (i: number) => exFree && currentRT == rtTrash && (i == null || i == srcs.length - 1);

            const onEx = (ex: any) => {
                if (active(null)) {
                    srcs.length = 0;
                    $("#evalRes").text("").append($("<i>").text(ex));
                    exFree = false;
                }
            };

            let totalBinary = "";
            srcs.forEach((text, i) => {
                rtTrash.compile(text,
                    binary => {
                        totalBinary += binary;
                        if (active(null))
                            $("#evalBin").text(totalBinary);
                        if (active(i)) {
                            $("#evalRes").text("").append($("<i>").text("running..."));
                            rtTrash.eval(totalBinary, active(i) ? res => $("#evalRes").text(res) : _ => { }, onEx);
                        }
                    },
                    onEx);
            });
            rtTrash.dumpStats();
            rtTrash.autoClose();
        }, 500);
    }, () => names, $("#evalSrc").css("min-height", "15px"));
    evalPad.text = localStorage.getItem("fun") || "reverse $ listDistinct \"Hallo Welt\" isEQ";
    evalPad.focus();

    const populate = (lib: string) => {
        $.get(libraryPath + lib + ".txt", (data: string) => {
            var sSpan = $("#" + lib);
            data.split("~~~").forEach((str, i) => {
                var parts = str.split("~~");
                if (i > 0) sSpan.append("&nbsp;&nbsp;&nbsp;");
                sSpan.append($("<a>")
                    .text(parts[0].trim())
                    .css("cursor", "pointer")
                    .click(() => evalPad.text = parts[1].trim()));
            });
        }, "text");
    }
    populate('samples');
    populate('lessons');
});
