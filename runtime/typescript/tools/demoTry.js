/// <reference path="demoCommon.ts" />
onReady.push(function () {
    // EVAL PAD
    var safeString = function (s) { return "[" + s.split("").map(function (x) { return x.charCodeAt(0).toString(); }).join(",") + "]"; };
    var currentRT = null;
    var debounceHandle = undefined;
    var evalPad = new IntelliHTML(true, function (text) {
        $("#evalRes").text("").append($("<i>").text("pending..."));
        $("#evalDebug").text("").append($("<i>").text("pending..."));
        clearTimeout(debounceHandle);
        debounceHandle = setTimeout(function () {
            var rtTrash = rtClean.clone();
            currentRT = rtTrash;
            localStorage.setItem("fun", text);
            var srcs = splitSources(text);
            var exFree = true;
            var onEx = function (ex) {
                if (currentRT == rtTrash) {
                    srcs.length = 0;
                    $("#evalRes").text("").append($("<i>").text(ex));
                    exFree = false;
                }
            };
            srcs.forEach(function (text, i) {
                rtTrash.compile(text, function (binary) { return rtTrash.eval(binary, exFree && (i < srcs.length - 1 || currentRT != rtTrash) ? function (_) {
                } : function (res) { return $("#evalRes").text(res); }, onEx); }, onEx);
                rtTrash.compile("fullDebug " + safeString(text), function (binary) { return rtTrash.eval(binary, exFree && (i < srcs.length - 1 || currentRT != rtTrash) ? function (_) {
                } : function (res) { return $("#evalDebug").text(res); }, onEx); }, onEx);
            });
            rtTrash.autoClose();
        }, 500);
    }, function () { return names; }, $("#evalSrc").css("min-height", "15px"));
    evalPad.text = localStorage.getItem("fun") || "reverse $ listDistinct \"Hallo Welt\" isEQ";
    evalPad.focus();
    $.get(libraryPath + "samples.txt", function (data) {
        var sSpan = $("#samples");
        data.split("---").forEach(function (str, i) {
            var parts = str.split("--");
            if (i > 0)
                sSpan.append("&nbsp;&nbsp;&nbsp;");
            sSpan.append($("<a>").text(parts[0].trim()).css("cursor", "pointer").click(function () { return evalPad.text = parts[1].trim(); }));
        });
    }, "text");
});
//# sourceMappingURL=demoTry.js.map