/// <reference path="jquery.d.ts" />
var tabSpaces = "    ";
var tabWidth = tabSpaces.length;
var acCount = 11;
function setCaret(range) {
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}
class IntelliHTML {
    constructor(highlight, onTextChanged, getACitems, pre = $("<pre>")) {
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
        this.code.keydown(eo => {
            // TAB
            if (eo.which == 9) {
                eo.preventDefault();
                this.acSpan.hide();
                var range = this.caretPosition;
                if (range != null) {
                    var text = this.text;
                    var startOffset = this.caretIndex(range);
                    var start = text.lastIndexOf("\n", startOffset - 1);
                    text = text.substring(start + 1, startOffset);
                    var insert = tabWidth - text.length % tabWidth;
                    var spacesNode = document.createTextNode(tabSpaces.substr(0, insert));
                    range.insertNode(spacesNode);
                    range.setStartAfter(spacesNode);
                    setCaret(range);
                    this.triggerOnTextChanged();
                }
            }
            // AC up down
            if ((eo.which == 40 || eo.which == 38) && this.acSpan.is(":visible")) {
                eo.preventDefault();
                this.showAC(eo.which == 40 ? 1 : -1);
            }
            // enter
            if (eo.which == 13) {
                eo.preventDefault();
                // AC enter
                if (this.acSpan.is(":visible"))
                    this.applyAC();
                else {
                    this.acSpan.hide();
                    var range = this.caretPosition;
                    if (range == null)
                        return;
                    range = range.cloneRange();
                    var breakNode = document.createTextNode("\n");
                    range.insertNode(breakNode);
                    range.setStartAfter(breakNode);
                    setCaret(range);
                    this.triggerOnTextChanged();
                }
            }
            // Ctrl+Space
            if (eo.which == 32 && eo.ctrlKey) {
                eo.preventDefault();
                this.showAC(0, true);
            }
            // console.log(eo.which);
        });
        this.code.keyup(eo => {
            if ((eo.which == 37 || eo.which == 39) && this.acSpan.is(":visible"))
                this.acSpan.hide();
            //this.showAC();
        });
        this.code.on("input", () => {
            this.triggerOnTextChanged();
            this.showAC();
        });
        this.pre.click(eo => this.code.focus());
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
        this.code.mousedown(() => this.acSpan.hide());
    }
    triggerOnTextChanged() {
        var newText = this.text;
        this.updateHighlight(newText);
        if (this.lastText == newText)
            return;
        this.lastText = newText;
        this.onTextChanged(newText);
    }
    applyAC() {
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
    }
    traceIndex(index, node) {
        if (node.nodeType == 3)
            return { index: Math.min(index, node.textContent.length), node: node };
        var res = null;
        var contents = $(node).contents();
        contents.each((i, e) => {
            var elen = e.textContent.length;
            if (res == null)
                if (elen <= index && i < contents.length - 1)
                    index -= elen;
                else
                    res = this.traceIndex(index, e);
        });
        return res;
    }
    createCodeRange(start, length) {
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
    }
    _updateHighlight(text) {
        var saveCaret = this.caretIndex(this.caretPosition);
        // clear all formatting
        this.code.text(text);
        if (this.highlight) {
            // format
            var format = (regex, formatter) => {
                var match;
                while (match = regex.exec(text))
                    formatter(this.createCodeRange(match.index, match.toString().length));
            };
            // operators
            format(/[$]/g, jq => jq.css("color", "hsl(350, 40%, 50%)"));
            // punctuation
            format(/[\[\]\(\),=]/g, jq => jq.css("opacity", ".7"));
            // number
            format(/\b[0-9]+\b/g, jq => jq.css("color", "hsl(100, 80%, 80%)"));
            // ctors
            format(/\b[A-Z][_a-zA-Z0-9']*\b/g, jq => jq.css("color", "hsl(350, 60%, 80%)"));
            // refs
            format(/\b[a-z][_a-zA-Z0-9']*\b/g, jq => jq.css("color", "inherit"));
            // abstr
            format(/\\[a-z][_a-zA-Z0-9']*\b/g, jq => jq.css("color", "hsl(200, 80%, 70%)"));
            format(/\\/g, jq => jq.css("color", "inherit").css("opacity", ".7"));
            // string
            format(/"[^"]*"/g, jq => jq.css("color", "hsl(20, 70%, 70%)"));
            // comment
            format(/\'.*/g, jq => jq.css("color", "hsl(100, 50%, 55%)").css("font-style", "italic"));
        }
        // restore caret
        var loc = this.traceIndex(saveCaret, this.codeNative);
        var range = document.createRange();
        range.setStart(loc.node, loc.index);
        setCaret(range);
    }
    updateHighlight(text) {
        if (this.debHLid != null)
            clearTimeout(this.debHLid);
        this.debHLid = setTimeout(() => this._updateHighlight(text), 1000);
    }
    get caretPosition() {
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
    }
    caretIndex(caretPosition) {
        if (caretPosition == null)
            return 0;
        var range = caretPosition.cloneRange();
        range.selectNodeContents(this.codeNative);
        range.setEnd(caretPosition.startContainer, caretPosition.startOffset);
        return range.toString().length;
    }
    showAC(moveSelection = 0, explicit = false) {
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
        t = t.filter((v, i) => i == 0 || v != t[i - 1]); // distinct
        var result = [];
        var resultAny = [];
        var vLower = v.toLowerCase();
        var vLen = v.length;
        t.forEach(tt => {
            var index = tt.toLowerCase().indexOf(vLower);
            if (index != -1)
                (index == 0 ? result : resultAny).push({ x: tt, i: index });
        });
        Array.prototype.push.apply(result, resultAny);
        if (result.length == 0)
            return;
        // handle/update lastACitem
        var indexs = result
            .map((x, i) => { return { x: x.x, i: i }; })
            .filter(t => t.x == this.acState.item)
            .map(t => t.i);
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
        result.forEach(x => {
            var p = $("<p>").css("padding", "0px");
            p.append($("<span>").text(x.x.slice(0, x.i)));
            p.append($("<span>").text(x.x.slice(x.i, x.i + vLen)).css("color", "salmon"));
            p.append($("<span>").text(x.x.slice(x.i + vLen)));
            p.css("cursor", "pointer");
            p.click(() => {
                this.acState.item = x.x;
                this.applyAC();
            });
            // selection
            if (x.x == this.acState.item)
                p.css("background-color", "#444444");
            this.acList.append(p);
        });
        this.acSpan.show();
    }
    get element() {
        return this.pre;
    }
    focus() {
        this.code.focus();
    }
    get text() {
        var cl = this.code.clone();
        cl.find("br").replaceWith("\n");
        return cl.text();
    }
    set text(text) {
        this.acSpan.hide();
        this.code.text(text);
        this.triggerOnTextChanged();
    }
}
