/// <reference path="jquery.d.ts" />
var IntelliHTML = (function () {
    //private acPos: number;
    function IntelliHTML(onTextChanged) {
        var _this = this;
        if (onTextChanged === void 0) { onTextChanged = function (_) {
        }; }
        this.onTextChanged = onTextChanged;
        this.preNative = document.createElement("pre");
        this.pre = $(this.preNative);
        this.pre.css("cursor", "text");
        this.codeNative = document.createElement("code");
        this.code = $(this.codeNative);
        var wrapCode = $("<div>");
        wrapCode.css("height", "0px");
        wrapCode.append(this.code);
        wrapCode.appendTo(this.pre);
        this.code.attr("spellcheck", false);
        this.code.attr("contentEditable", true);
        this.code.keydown(function (eo) {
            if (eo.which == 9) {
                eo.preventDefault();
                var range = _this.caretPosition;
                console.log(_this.caretPosition.startOffset);
                if (range != null) {
                    var text = _this.text;
                    var start = Math.max(0, text.lastIndexOf("\n", range.startOffset));
                    text = text.substring(start, range.startOffset);
                    document.title = text;
                }
            }
        });
        this.pre.click(function (eo) { return _this.code.focus(); });
        this.codeStyledNative = document.createElement("code");
        this.codeStyled = $(this.codeStyledNative);
        this.codeStyled.appendTo(this.pre);
        var wrapCodeStyled = $("<div>");
        wrapCodeStyled.css("height", "0px");
        wrapCodeStyled.append(this.codeStyled);
        wrapCodeStyled.appendTo(this.pre);
        this.codeStyled.click(function (eo) { return _this.code.focus(); });
        wrapCodeStyled.css("pointer-events", "none");
        this.acSpanNative = document.createElement("span");
        this.acSpan = $(this.acSpanNative);
        this.acSpan.prependTo(this.pre);
        this.acSpan.width(0);
        this.acSpan.css("position", "absolute");
        this.acSpan.hide();
        this.acListNative = document.createElement("div");
        this.acList = $(this.acListNative);
        this.acList.appendTo(this.acSpan);
        this.acList.width(200);
        this.acList.css("position", "relative");
        this.acList.css("top", "1.5em");
        this.acList.css("border", "1px solid white");
        this.acList.text("asd");
        //this.acPos = 0;
        this.init();
    }
    Object.defineProperty(IntelliHTML.prototype, "caretPosition", {
        get: function () {
            var range;
            var container;
            try {
                range = window.getSelection().getRangeAt(0);
                //range.selectNodeContents(
                var cont = range.startContainer;
                while (cont.nodeType != 1)
                    cont = cont.parentNode;
                var container = cont;
                if (!this.codeNative.contains(container))
                    return null; // caret not in code!
            }
            catch (e) {
                console.log(e);
                return null;
            }
            return range;
        },
        enumerable: true,
        configurable: true
    });
    IntelliHTML.prototype.init = function () {
        var _this = this;
        this.text = "asd pre sub";
        this.codeStyled.css("color", "transparent");
        var code = this.code;
        var update = function () {
            var codeText = _this.text;
            // mirror
            _this.codeStyled.text(codeText);
            // hide ac
            _this.acList.hide();
            // get caret information
            var range = _this.caretPosition;
            if (range == null)
                return;
            var x, y;
            x = range.getClientRects()[0].left | 0;
            y = range.getClientRects()[0].top | 0;
            // extract current identifier
            var text = codeText.slice(0, range.startOffset);
            var vv = /[a-zA-Z_][a-zA-Z0-9_]*$/.exec(text);
            if (vv == null)
                return;
            var v = vv == null ? "" : vv[0];
            //var idStart = text.length - v.length;
            //range.setStart(range.startContainer, idStart);
            // move AC span
            _this.acSpan.offset({ left: x, top: y });
            //this.acSpan.offset($(container).offset());
            var t = rt.getNames().sort(compareStrings);
            /*
            var index = bsearch(v, t);
            console.log(index);
            t = t.slice(index);
            */
            var resultStart = [];
            var resultAny = [];
            var vLower = v.toLowerCase();
            var vLen = v.length;
            t.forEach(function (tt) {
                var index = tt.toLowerCase().indexOf(vLower);
                if (index != -1)
                    (index == 0 ? resultStart : resultAny).push({ x: tt, i: index });
            });
            Array.prototype.push.apply(resultStart, resultAny);
            _this.acList.html(resultStart.map(function (x) { return x.x.slice(0, x.i) + "<span style='color: red;'>" + x.x.slice(x.i, x.i + vLen) + "</span>" + x.x.slice(x.i + vLen); }).join("<br/>"));
            //this.acList.show();
        };
        code.on("input", function () {
            _this.onTextChanged(_this.code.text());
            update();
        });
        //setInterval(() => update(), 1000);
    };
    Object.defineProperty(IntelliHTML.prototype, "element", {
        get: function () {
            return this.pre;
        },
        enumerable: true,
        configurable: true
    });
    IntelliHTML.prototype.focus = function () {
        this.code.focus();
    };
    Object.defineProperty(IntelliHTML.prototype, "text", {
        get: function () {
            return this.code.text();
        },
        set: function (text) {
            this.code.text(text);
            this.onTextChanged(text);
        },
        enumerable: true,
        configurable: true
    });
    return IntelliHTML;
})();
//# sourceMappingURL=IntelliHTML.js.map