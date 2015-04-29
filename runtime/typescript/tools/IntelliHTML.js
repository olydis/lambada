/// <reference path="jquery.d.ts" />
var tabSpaces = "    ";
var tabWidth = tabSpaces.length;
var acCount = 11;
function setCaret(range) {
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}
var IntelliHTML = (function () {
    function IntelliHTML(onTextChanged, getACitems, pre) {
        var _this = this;
        if (pre === void 0) { pre = $("<pre>"); }
        this.lastACitem = "";
        this.onTextChanged = onTextChanged;
        this.getACitems = getACitems;
        this.pre = pre;
        this.pre.css("cursor", "text");
        this.codeNative = document.createElement("p");
        this.code = $(this.codeNative);
        this.code.css("padding", "0px");
        var wrapCode = $("<div>");
        //wrapCode.css("height", "0px");
        wrapCode.append(this.code);
        wrapCode.appendTo(this.pre);
        this.code.attr("spellcheck", "false");
        this.code.attr("contentEditable", "true");
        this.code.keydown(function (eo) {
            // TAB
            if (eo.which == 9) {
                eo.preventDefault();
                _this.acSpan.hide();
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
                    _this.triggerOnTextChanged();
                }
            }
            // AC up down
            if ((eo.which == 40 || eo.which == 38) && _this.acSpan.is(":visible")) {
                eo.preventDefault();
                _this.showAC(eo.which == 40 ? 1 : -1);
            }
            // AC enter
            if (eo.which == 13 && _this.acSpan.is(":visible")) {
                eo.preventDefault();
                _this.acSpan.hide();
                var range = _this.caretPosition;
                if (range == null)
                    return;
                range = range.cloneRange();
                // extract current identifier
                var caretIndex = _this.caretIndex(range);
                var text = _this.text.slice(0, caretIndex);
                var vv = /[a-zA-Z_][a-zA-Z0-9_]*$/.exec(text);
                if (vv == null)
                    return;
                var v = vv == null ? "" : vv[0];
                range.setStart(range.startContainer, Math.max(0, range.startOffset - v.length));
                range.deleteContents();
                var acNode = document.createTextNode(_this.lastACitem);
                range.insertNode(acNode);
                range.setStartAfter(acNode);
                setCaret(range);
                _this.triggerOnTextChanged();
            }
            // Ctrl+Space
            if (eo.which == 32 && eo.ctrlKey) {
                eo.preventDefault();
                _this.showAC();
            }
            // console.log(eo.which);
        });
        this.code.keyup(function (eo) {
            if ((eo.which == 37 || eo.which == 39) && _this.acSpan.is(":visible"))
                _this.showAC();
        });
        this.code.on("input", function () {
            _this.triggerOnTextChanged();
            _this.showAC();
        });
        this.pre.click(function (eo) { return _this.code.focus(); });
        this.codeStyledNative = document.createElement("p");
        this.codeStyled = $(this.codeStyledNative);
        this.codeStyled.css("padding", "0px");
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
        this.acList.css("min-width", "200px");
        this.acList.css("position", "relative");
        this.acList.css("display", "inline-block");
        this.acList.css("margin", "-4px");
        this.acList.css("padding", "4px");
        this.acList.css("top", "1.5em");
        this.acList.css("background-color", "#2a2a2a");
        this.acList.css("border-radius", "4px");
        this.acList.css("border", "1.5px solid #555");
        // INIT
        this.codeStyled.hide();
        this.pre.mousedown(function () { return _this.acSpan.hide(); });
        //setInterval(() => update(), 1000);
    }
    IntelliHTML.prototype.triggerOnTextChanged = function () {
        this.onTextChanged(this.text);
    };
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
                console.error(e);
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
    IntelliHTML.prototype.showAC = function (moveSelection) {
        var _this = this;
        if (moveSelection === void 0) { moveSelection = 0; }
        // normalize HTML
        var html = this.code.html();
        var html2 = html.replace(/\<br\>/gi, '\n');
        if (html != html2) {
            var range = this.caretPosition;
            var pos = this.caretIndex(range);
            this.code.html(html2);
            range.setStart(this.codeNative.firstChild, pos + 1);
            setCaret(range);
            return;
        }
        var codeText = this.text;
        // mirror
        this.codeStyled.text(codeText);
        // hide ac
        this.acSpan.hide();
        // get caret information
        var range = this.caretPosition;
        if (range == null)
            return;
        range = range.cloneRange();
        // extract current identifier
        var caretIndex = this.caretIndex(range);
        var text = codeText.slice(0, caretIndex);
        var vv = /[a-zA-Z_][a-zA-Z0-9_]*$/.exec(text);
        if (vv == null)
            return;
        var v = vv == null ? "" : vv[0];
        // - check for non-identifier fronts
        var indexBefore = caretIndex - v.length - 1;
        if (indexBefore >= 0 && (text.charAt(indexBefore) == "\\" || text.charAt(indexBefore) == "\""))
            return;
        range.setStart(range.startContainer, Math.max(0, range.startOffset - v.length));
        var x, y;
        x = (range.getClientRects()[0].left | 0) + $(window).scrollLeft();
        y = (range.getClientRects()[0].top | 0) + $(window).scrollTop();
        // move AC span
        this.acSpan.css("left", x + "px");
        this.acSpan.css("top", y + "px");
        // get completion results
        var names = this.getACitems();
        // - add local names
        var regex = /\\[a-zA-Z_][a-zA-Z0-9_]*/g;
        while (vv = regex.exec(text))
            names.push(vv[0].substr(1));
        // - process
        var t = names.sort(compareStrings);
        t = t.filter(function (v, i) { return i == 0 || v != t[i - 1]; }); // distinct
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
        if (result.length == 0)
            return;
        // handle/update lastACitem
        var indexs = result.map(function (x, i) {
            return { x: x.x, i: i };
        }).filter(function (t) { return t.x == _this.lastACitem; }).map(function (t) { return t.i; });
        var index = indexs.length == 0 ? 0 : indexs[0];
        index = (index + moveSelection + result.length) % result.length;
        this.lastACitem = result[index].x;
        // display results
        var acListOffset = Math.max(Math.min(1 + index - (acCount / 2) | 0, result.length - acCount), 0);
        var hiddenFront = acListOffset > 0;
        var hiddenBack = result.length > acListOffset + acCount;
        result = result.slice(acListOffset, acListOffset + acCount);
        var boxShadow = "";
        if (hiddenFront)
            boxShadow += "#555 0px 20px 20px -10px inset";
        if (hiddenFront && hiddenBack)
            boxShadow += ",";
        if (hiddenBack)
            boxShadow += "#555 0px -20px 20px -10px inset";
        this.acList.css("box-shadow", boxShadow);
        this.acList.empty();
        result.forEach(function (x) {
            var p = $("<p>").css("padding", "0px");
            p.append($("<span>").text(x.x.slice(0, x.i)));
            p.append($("<span>").text(x.x.slice(x.i, x.i + vLen)).css("color", "salmon"));
            p.append($("<span>").text(x.x.slice(x.i + vLen)));
            // selection
            if (x.x == _this.lastACitem)
                p.css("background-color", "#444444");
            _this.acList.append(p);
        });
        this.acSpan.show();
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
            this.acSpan.hide();
            this.code.text(text);
            this.onTextChanged(text);
        },
        enumerable: true,
        configurable: true
    });
    return IntelliHTML;
})();
//# sourceMappingURL=IntelliHTML.js.map