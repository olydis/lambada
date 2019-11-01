/// <reference path="demoCommon.ts" />
onReady.push(function () {
    // EVAL PAD
    var safeString = function (s) { return "[" + s.split("").map(function (x) { return x.charCodeAt(0).toString(); }).join(",") + "]"; };
    var currentRT = null;
    var debounceHandle = undefined;
    var evalPad = new IntelliHTML(true, function (text) {
        // $("#evalBin").text("").append($("<i>").text("starting compilation shortly (debouncing)..."));
        $("#evalRes").text("").append($("<i>").text("compiling..."));
        clearTimeout(debounceHandle);
        debounceHandle = setTimeout(function () {
            var rtTrash = rtClean.clone();
            if (currentRT != null)
                currentRT.close();
            currentRT = rtTrash;
            localStorage.setItem("fun", text);
            var srcs = splitSources(text);
            var exFree = true;
            var active = function (i) { return exFree && currentRT == rtTrash && (i == null || i == srcs.length - 1); };
            var onEx = function (ex) {
                if (active(null)) {
                    srcs.length = 0;
                    $("#evalRes").text("").append($("<i>").text(ex));
                    exFree = false;
                }
            };
            var totalBinary = "";
            srcs.forEach(function (text, i) {
                rtTrash.compile(text, function (binary) {
                    totalBinary += binary;
                    // if (active(null))
                    //     $("#evalBin").text(totalBinary);
                    if (active(i)) {
                        $("#evalRes").text("").append($("<i>").text("running..."));
                        rtTrash.eval(totalBinary, active(i) ? function (res) { return $("#evalRes").text(res); } : function (_) { }, onEx);
                    }
                }, onEx);
            });
            rtTrash.dumpStats();
            rtTrash.autoClose();
        }, 500);
    }, function () { return names; }, $("#evalSrc").css("min-height", "15px"));
    evalPad.text = localStorage.getItem("fun") || "reverse $ listDistinct \"Hallo Welt\" isEQ";
    evalPad.focus();
    $.get(libraryPath + "samples.txt", function (data) {
        var sSpan = $("#samples");
        data.split("~~~").forEach(function (str, i) {
            var parts = str.split("~~");
            if (i > 0)
                sSpan.append("&nbsp;&nbsp;&nbsp;");
            sSpan.append($("<a>")
                .text(parts[0].trim())
                .css("cursor", "pointer")
                .click(function () { return evalPad.text = parts[1].trim(); }));
        });
    }, "text");
});
//# sourceMappingURL=demoTry.js.map