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
    function IntelliHTML(highlight, onTextChanged, getACitems, pre) {
        var _this = this;
        if (pre === void 0) { pre = $("<pre>"); }
        this.highlight = highlight;
        this.lastText = null;
        this.acState = {
            item: "",
            phrase: "",
            caretIndex: 0
        };
        this.debHLid = null;
        this.onTextChanged = onTextChanged;
        this.getACitems = getACitems;
        this.pre = pre;
        this.pre.css("cursor", "text");
        this.codeNative = document.createElement("code");
        this.code = $(this.codeNative);
        this.code.css("background-color", "transparent");
        this.code.css("box-shadow", "none");
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
            // enter
            if (eo.which == 13) {
                eo.preventDefault();
                // AC enter
                if (_this.acSpan.is(":visible"))
                    _this.applyAC();
                else {
                    _this.acSpan.hide();
                    var range = _this.caretPosition;
                    if (range == null)
                        return;
                    range = range.cloneRange();
                    var breakNode = document.createTextNode("\n");
                    range.insertNode(breakNode);
                    range.setStartAfter(breakNode);
                    setCaret(range);
                    _this.triggerOnTextChanged();
                }
            }
            // Ctrl+Space
            if (eo.which == 32 && eo.ctrlKey) {
                eo.preventDefault();
                _this.showAC(0, true);
            }
            // console.log(eo.which);
        });
        this.code.keyup(function (eo) {
            if ((eo.which == 37 || eo.which == 39) && _this.acSpan.is(":visible"))
                _this.acSpan.hide();
            //this.showAC();
        });
        this.code.on("input", function () {
            _this.triggerOnTextChanged();
            _this.showAC();
        });
        this.pre.click(function (eo) { return _this.code.focus(); });
        this.acSpanNative = document.createElement("span");
        this.acSpan = $(this.acSpanNative);
        this.acSpan.prependTo(this.pre);
        this.acSpan.width(0);
        this.acSpan.css("position", "absolute");
        this.acSpan.hide();
        this.acListNative = document.createElement("div");
        this.acList = $(this.acListNative);
        this.acList.appendTo(this.acSpan);
        this.acList.css("z-index", "1");
        this.acList.css("min-width", "200px");
        this.acList.css("position", "relative");
        this.acList.css("display", "inline-block");
        this.acList.css("margin", "-4px");
        this.acList.css("padding", "4px");
        this.acList.css("top", "1.5em");
        this.acList.css("background-color", "#2a2a2a");
        this.acList.css("border-radius", "4px");
        this.acList.css("border", "1.5px solid #555");
        this.code.mousedown(function () { return _this.acSpan.hide(); });
    }
    IntelliHTML.prototype.triggerOnTextChanged = function () {
        var newText = this.text;
        this.updateHighlight(newText);
        if (this.lastText == newText)
            return;
        this.lastText = newText;
        this.onTextChanged(newText);
    };
    IntelliHTML.prototype.applyAC = function () {
        this.acSpan.hide();
        var range = document.createRange();
        var idStart = this.traceIndex(this.acState.caretIndex - this.acState.phrase.length, this.codeNative);
        range.setStart(idStart.node, idStart.index);
        var idEnd = this.traceIndex(this.acState.caretIndex, this.codeNative);
        range.setEnd(idEnd.node, idEnd.index);
        range.deleteContents();
        var acNode = document.createTextNode(this.acState.item);
        range.insertNode(acNode);
        range.setStartAfter(acNode);
        setCaret(range);
        this.triggerOnTextChanged();
    };
    IntelliHTML.prototype.traceIndex = function (index, node) {
        var _this = this;
        if (node.nodeType == 3)
            return { index: Math.min(index, node.textContent.length), node: node };
        var res = null;
        var contents = $(node).contents();
        contents.each(function (i, e) {
            var elen = e.textContent.length;
            if (res == null)
                if (elen <= index && i < contents.length - 1)
                    index -= elen;
                else
                    res = _this.traceIndex(index, e);
        });
        return res;
    };
    IntelliHTML.prototype.createCodeRange = function (start, length) {
        var begin = this.traceIndex(start, this.codeNative);
        var end = this.traceIndex(start + length, this.codeNative);
        var range = document.createRange();
        range.setStart(begin.node, begin.index);
        range.setEnd(end.node, end.index);
        // insert element
        var elem = $("<span>").text(range.toString());
        range.deleteContents();
        range.insertNode(elem[0]);
        return elem;
    };
    IntelliHTML.prototype._updateHighlight = function (text) {
        var _this = this;
        var saveCaret = this.caretIndex(this.caretPosition);
        // clear all formatting
        this.code.text(text);
        if (this.highlight) {
            // format
            var format = function (regex, formatter) {
                var match;
                while (match = regex.exec(text))
                    formatter(_this.createCodeRange(match.index, match.toString().length));
            };
            // operators
            format(/[$]/g, function (jq) { return jq.css("color", "hsl(350, 40%, 50%)"); });
            // punctuation
            format(/[\[\]\(\),=]/g, function (jq) { return jq.css("opacity", ".7"); });
            // number
            format(/\b[0-9]+\b/g, function (jq) { return jq.css("color", "hsl(100, 80%, 80%)"); });
            // ctors
            format(/\b[A-Z][_a-zA-Z0-9']*\b/g, function (jq) { return jq.css("color", "hsl(350, 60%, 80%)"); });
            // refs
            format(/\b[a-z][_a-zA-Z0-9']*\b/g, function (jq) { return jq.css("color", "inherit"); });
            // abstr
            format(/\\[a-z][_a-zA-Z0-9']*\b/g, function (jq) { return jq.css("color", "hsl(200, 80%, 70%)"); });
            format(/\\/g, function (jq) { return jq.css("color", "inherit").css("opacity", ".7"); });
            // string
            format(/"[^"]*"/g, function (jq) { return jq.css("color", "hsl(20, 70%, 70%)"); });
            // comment
            format(/\'.*/g, function (jq) { return jq.css("color", "hsl(100, 50%, 55%)").css("font-style", "italic"); });
        }
        // restore caret
        var loc = this.traceIndex(saveCaret, this.codeNative);
        var range = document.createRange();
        range.setStart(loc.node, loc.index);
        setCaret(range);
    };
    IntelliHTML.prototype.updateHighlight = function (text) {
        var _this = this;
        if (this.debHLid != null)
            clearTimeout(this.debHLid);
        this.debHLid = setTimeout(function () { return _this._updateHighlight(text); }, 1000);
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
                // console.error(e);
                return null;
            }
            return range;
        },
        enumerable: true,
        configurable: true
    });
    IntelliHTML.prototype.caretIndex = function (caretPosition) {
        if (caretPosition == null)
            return 0;
        var range = caretPosition.cloneRange();
        range.selectNodeContents(this.codeNative);
        range.setEnd(caretPosition.startContainer, caretPosition.startOffset);
        return range.toString().length;
    };
    IntelliHTML.prototype.showAC = function (moveSelection, explicit) {
        var _this = this;
        if (moveSelection === void 0) { moveSelection = 0; }
        if (explicit === void 0) { explicit = false; }
        var codeText = this.text;
        // hide ac
        this.acSpan.hide();
        // get caret information
        var range = this.caretPosition;
        if (range == null)
            return;
        range = range.cloneRange();
        // extract current identifier
        this.acState.caretIndex = this.caretIndex(range);
        var text = codeText.slice(0, this.acState.caretIndex);
        var vv = /[a-zA-Z_][a-zA-Z0-9_]*$/.exec(text);
        var v = vv == null ? "" : vv[0];
        if (v == "" && !explicit)
            return;
        this.acState.phrase = v;
        // - check for non-identifier fronts
        var indexBefore = this.acState.caretIndex - v.length - 1;
        if (indexBefore >= 0 && (text.charAt(indexBefore) == "\\" || text.charAt(indexBefore) == "\""))
            return;
        var idStart = this.traceIndex(this.acState.caretIndex - v.length, this.codeNative);
        range.setStart(idStart.node, idStart.index);
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
        var indexs = result
            .map(function (x, i) { return { x: x.x, i: i }; })
            .filter(function (t) { return t.x == _this.acState.item; })
            .map(function (t) { return t.i; });
        var index = indexs.length == 0 ? 0 : indexs[0];
        index = (index + moveSelection + result.length) % result.length;
        this.acState.item = result[index].x;
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
            p.css("cursor", "pointer");
            p.click(function () {
                _this.acState.item = x.x;
                _this.applyAC();
            });
            // selection
            if (x.x == _this.acState.item)
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
            var cl = this.code.clone();
            cl.find("br").replaceWith("\n");
            return cl.text();
        },
        set: function (text) {
            this.acSpan.hide();
            this.code.text(text);
            this.triggerOnTextChanged();
        },
        enumerable: true,
        configurable: true
    });
    return IntelliHTML;
})();
//# sourceMappingURL=IntelliHTML.js.map