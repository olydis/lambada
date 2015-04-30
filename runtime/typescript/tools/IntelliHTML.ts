/// <reference path="jquery.d.ts" />

var tabSpaces = "    ";
var tabWidth = tabSpaces.length;
var acCount = 11;

function setCaret(range: Range)
{
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

class IntelliHTML
{
    private pre: JQuery;

    private code: JQuery;
    private codeNative: HTMLElement;

    private acSpan: JQuery;
    private acSpanNative: HTMLSpanElement;

    private acList: JQuery;
    private acListNative: HTMLDivElement;

    private triggerOnTextChanged(): void { this.onTextChanged(this.text); }
    private onTextChanged: (text: string) => void;

    private getACitems: () => string[];
    
    private lastACitem: string = "";

    public constructor(onTextChanged: (text: string) => void, getACitems: () => string[], pre: JQuery = $("<pre>"))
    {
        this.onTextChanged = text => { onTextChanged(text); this.updateHighlight(text); }
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
        this.code.keydown(eo =>
        {
            // TAB
            if (eo.which == 9)
            {
                eo.preventDefault();
                this.acSpan.hide();
                var range = this.caretPosition;
                if (range != null)
                {
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
            if ((eo.which == 40 || eo.which == 38) && this.acSpan.is(":visible"))
            {
                eo.preventDefault();
                this.showAC(eo.which == 40 ? 1 : -1);
            }
            // AC enter
            if (eo.which == 13 && this.acSpan.is(":visible"))
            {
                eo.preventDefault();
                this.acSpan.hide();

                var range: Range = this.caretPosition;
                if (range == null) return;
                range = range.cloneRange();

                // extract current identifier
                var caretIndex = this.caretIndex(range);
                var text = this.text.slice(0, caretIndex);
                var vv = /[a-zA-Z_][a-zA-Z0-9_]*$/.exec(text);
                if (vv == null)
                    return;
                var v = vv == null ? "" : vv[0];

                range.setStart(range.startContainer, Math.max(0, range.startOffset - v.length));
                range.deleteContents();
                var acNode = document.createTextNode(this.lastACitem);
                range.insertNode(acNode);
                range.setStartAfter(acNode);
                setCaret(range);
                this.triggerOnTextChanged();
            }
            // Ctrl+Space
            if (eo.which == 32 && eo.ctrlKey)
            {
                eo.preventDefault();
                this.showAC();
            }
            // console.log(eo.which);
        });
        this.code.keyup(eo =>
        {
            if ((eo.which == 37 || eo.which == 39) && this.acSpan.is(":visible"))
                this.showAC();
        });
        this.code.on("input",() =>
        {
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
        
        this.pre.mousedown(() => this.acSpan.hide());
        //setInterval(() => update(), 1000);
    }

    private traceIndex(index: number, node: Element): { index: number; node: Element }
    {
        if (node.nodeType == 3)
            return { index: Math.min(index, node.textContent.length), node: node };
        var res: { index: number; node: Element } = null;
        $(node).contents().each((i, e) =>
        {
            var elen = e.textContent.length;
            if (res == null)
                if (elen < index)
                    index -= elen;
                else
                    res = this.traceIndex(index, e);
        });
        return res;
    }
    private createCodeRange(start: number, length: number): JQuery
    {
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
    private updateHighlight(text: string)
    {
        var saveCaret = this.caretIndex(this.caretPosition);

        // clear all formatting
        this.code.text(text);
        
        // format
        var format = (regex: RegExp, formatter: (jq: JQuery) => void) =>
        {
            var match: RegExpExecArray;
            while (match = regex.exec(text))
                formatter(this.createCodeRange(match.index, match.toString().length));
        };

        // operators
        format(/[$]/g,
            jq => jq.css("color", "hsl(350, 40%, 50%)"));
        // punctuation
        format(/[\[\]\(\),=]/g,
            jq => jq.css("opacity", ".7"));
        // number
        format(/\b[0-9]+\b/g,
            jq => jq.css("color", "hsl(100, 80%, 80%)"));
        // ctors
        format(/\b[A-Z][_a-zA-Z0-9']*\b/g,
            jq => jq.css("color", "hsl(350, 60%, 80%)"));
        // refs
        format(/\b[a-z][_a-zA-Z0-9']*\b/g,
            jq => jq.css("color", "inherit"));
        // abstr
        format(/\\[a-z][_a-zA-Z0-9']*\b/g,
            jq => jq.css("color", "hsl(200, 80%, 70%)"));
        format(/\\/g,
            jq => jq.css("color", "inherit").css("opacity", ".7"));
        // string
        format(/"[^"]*"/g,
            jq => jq.css("color", "hsl(20, 70%, 70%)"));
        // comment
        format(/\'.*/g,
            jq => jq.css("color", "hsl(100, 50%, 55%)"));


        // restore caret
        var loc = this.traceIndex(saveCaret, this.codeNative);
        var range = document.createRange();
        range.setStart(loc.node, loc.index);
        setCaret(range);
    }

    private get caretPosition(): Range
    {
        var range: Range;
        var container: HTMLElement;
        try
        {
            range = window.getSelection().getRangeAt(0);

            var cont = range.startContainer;
            while (cont.nodeType != 1)
                cont = cont.parentNode;
            var container = <HTMLElement>cont;

            if (!this.codeNative.contains(container))
                return null; // caret not in code!
        }
        catch (e)
        {
            // console.error(e);
            return null;
        }

        return range;
    }
    private caretIndex(caretPosition: Range): number
    {
        if (caretPosition == null) return 0;
        var range = caretPosition.cloneRange();
        range.selectNodeContents(this.codeNative);
        range.setEnd(caretPosition.startContainer, caretPosition.startOffset);
        return range.toString().length;
    }

    private showAC(moveSelection: number = 0)
    {
        // normalize HTML
        var html = this.code.html();
        var html2 = html.replace(/\<br\>/gi, '\n');
        if (html != html2)
        {
            var range = this.caretPosition;
            var pos = this.caretIndex(range);
            this.code.html(html2);
            range.setStart(this.codeNative.firstChild, pos + 1);
            setCaret(range);
            return;
        }

        var codeText = this.text;
        
        // hide ac
        this.acSpan.hide();

        // get caret information
        var range: Range = this.caretPosition;
        if (range == null) return;
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

        var x: number, y: number;
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
        t = t.filter((v, i) => i == 0 || v != t[i-1]); // distinct
        var result: { x: string; i: number }[] = [];
        var resultAny: { x: string; i: number }[] = [];
        var vLower = v.toLowerCase();
        var vLen = v.length;
        t.forEach(tt =>
        {
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
            .filter(t => t.x == this.lastACitem)
            .map(t => t.i);

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
        result.forEach(x =>
        {
            var p = $("<p>").css("padding", "0px");
            p.append($("<span>").text(x.x.slice(0, x.i)));
            p.append($("<span>").text(x.x.slice(x.i, x.i + vLen)).css("color", "salmon"));
            p.append($("<span>").text(x.x.slice(x.i + vLen)));

            // selection
            if (x.x == this.lastACitem)
                p.css("background-color", "#444444");

            this.acList.append(p);
        });
        this.acSpan.show();
    }

    public get element(): JQuery
    {
        return this.pre;
    }

    public focus(): void
    {
        this.code.focus();
    }

    public get text(): string
    {
        return this.code.text();
    }

    public set text(text: string)
    {
        this.acSpan.hide();
        this.code.text(text);
        this.onTextChanged(text);
    }

}