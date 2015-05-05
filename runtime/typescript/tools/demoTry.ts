/// <reference path="demoCommon.ts" />

onReady.push(() =>
{
    // EVAL PAD
    var safeString = (s: string) => "[" + s.split("").map(x => x.charCodeAt(0).toString()).join(",") + "]";

    var currentRT: AsyncRuntime = null;
    var debounceHandle: number = undefined;
    var evalPad = new IntelliHTML(true, text => 
    {
        $("#evalRes").text("").append($("<i>").text("pending..."));
        $("#evalDebug").text("").append($("<i>").text("pending..."));

        clearTimeout(debounceHandle);
        debounceHandle = setTimeout(() =>
        {
            var rtTrash = rtClean.clone();
            if (currentRT != null) currentRT.close();
            currentRT = rtTrash;
            localStorage.setItem("fun", text);
            var srcs = splitSources(text);

            var exFree = true;

            var onEx = (ex: any) =>
            {
                if (currentRT == rtTrash)
                {
                    srcs.length = 0;
                    $("#evalRes").text("").append($("<i>").text(ex));
                    exFree = false;
                }
            };

            srcs.forEach((text, i) =>
            {
                rtTrash.compile(text,
                    binary => rtTrash.eval(binary, exFree && (i < srcs.length - 1 || currentRT != rtTrash) ? _ => { } : res => $("#evalRes").text(res), onEx),
                    onEx);
                rtTrash.compile("fullDebug " + safeString(text),
                    binary => rtTrash.eval(binary, exFree && (i < srcs.length - 1 || currentRT != rtTrash) ? _ => { } : res => $("#evalDebug").text(res), onEx),
                    onEx);
            });
            rtTrash.autoClose();
        }, 500);
    },() => names, $("#evalSrc").css("min-height", "15px"));
    evalPad.text = localStorage.getItem("fun") || "reverse $ listDistinct \"Hallo Welt\" isEQ";
    evalPad.focus();

    $.get(libraryPath + "samples.txt",(data: string) =>
    {
        var sSpan = $("#samples");
        data.split("---").forEach((str, i) =>
        {
            var parts = str.split("--");
            if (i > 0) sSpan.append("&nbsp;&nbsp;&nbsp;");
            sSpan.append($("<a>")
                .text(parts[0].trim())
                .css("cursor", "pointer")
                .click(() => evalPad.text = parts[1].trim()));
        });
    }, "text");
});