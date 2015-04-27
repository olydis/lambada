/// <reference path="jquery.d.ts" />
var tabSpaces = "    ";
var tabWidth = tabSpaces.length;
function setCaret(range) {
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}
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
        this.code.attr("spellcheck", "false");
        this.code.attr("contentEditable", "true");
        this.code.keydown(function (eo) {
            if (eo.which == 9) {
                eo.preventDefault();
                var range = _this.caretPosition;
                if (range != null) {
                    var text = _this.text;
                    var startOffset = _this.caretIndex(range);
                    var start = text.lastIndexOf("\n", startOffset - 1);
                    text = text.substring(start + 1, startOffset);
                    var insert = tabWidth - text.length % tabWidth;
                    var spacesNode = document.createTextNode(tabSpaces.substr(0, insert));
                    range.insertNode(spacesNode);
                    range.setStartAfter(spacesNode);
                    setCaret(range);
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
        var acListNative2 = document.createElement("div");
        var acList2 = $(acListNative2);
        acList2.appendTo(this.acSpan);
        acList2.css("position", "relative");
        acList2.css("top", "1.5em");
        this.acListNative = document.createElement("div");
        this.acList = $(this.acListNative);
        this.acList.appendTo(acList2);
        this.acList.width(200);
        this.acList.css("position", "relative");
        this.acList.css("overflow", "hidden");
        this.acList.css("margin", "-4px");
        this.acList.css("padding", "4px");
        this.acList.css("background-color", "#2a2a2a");
        this.acList.css("border-radius", "4px");
        this.acList.css("box-shadow", "rgba(100, 100, 100, 0.9) 0 0 3px 0px inset");
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
    IntelliHTML.prototype.caretIndex = function (caretPosition) {
        var range = caretPosition.cloneRange();
        range.selectNodeContents(this.codeNative);
        range.setEnd(caretPosition.startContainer, caretPosition.startOffset);
        return range.toString().length;
    };
    IntelliHTML.prototype.init = function () {
        var _this = this;
        this.codeStyled.css("color", "transparent");
        var code = this.code;
        var update = function () {
            // normalize HTML
            var html = _this.code.html();
            var html2 = html.replace(/\<br\>/gi, '\n');
            if (html != html2) {
                var range = _this.caretPosition;
                var pos = _this.caretIndex(range);
                console.log(pos);
                _this.code.html(html2);
                range.setStart(_this.codeNative.firstChild, pos + 1);
                setCaret(range);
                return;
            }
            var codeText = _this.text;
            // mirror
            _this.codeStyled.text(codeText);
            // hide ac
            _this.acSpan.hide();
            // get caret information
            var range = _this.caretPosition;
            if (range == null)
                return;
            range = range.cloneRange();
            // extract current identifier
            var caretIndex = _this.caretIndex(range);
            var text = codeText.slice(0, caretIndex);
            var vv = /[a-zA-Z_][a-zA-Z0-9_]*$/.exec(text);
            if (vv == null)
                return;
            var v = vv == null ? "" : vv[0];
            range.setStart(range.startContainer, Math.max(0, range.startOffset - v.length));
            var x, y;
            x = range.getClientRects()[0].left | 0;
            y = range.getClientRects()[0].top | 0;
            // move AC span
            _this.acSpan.css("left", x + "px");
            _this.acSpan.css("top", y + "px");
            //this.acSpan.offset($(container).offset());
            var t = rt.getNames().sort(compareStrings);
            /*
            var index = bsearch(v, t);
            console.log(index);
            t = t.slice(index);
            */
            var result = [];
            var resultAny = [];
            var vLower = v.toLowerCase();
            var vLen = v.length;
            t.forEach(function (tt) {
                var index = tt.toLowerCase().indexOf(vLower);
                if (index != -1)
                    (index == 0 ? result : resultAny).push({ x: tt, i: index });
            });
            Array.prototype.push.apply(result, resultAny);
            result = result.slice(0, 10);
            _this.acList.html(result.map(function (x) { return x.x.slice(0, x.i) + "<span style='color: salmon;'>" + x.x.slice(x.i, x.i + vLen) + "</span>" + x.x.slice(x.i + vLen); }).join("<br/>"));
            if (result.length > 0)
                _this.acSpan.show();
        };
        code.on("input", function () {
            _this.onTextChanged(_this.code.text());
            update();
        });
        this.pre.mousedown(function () { return _this.acSpan.hide(); });
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