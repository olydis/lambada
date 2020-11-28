/// <reference path="jquery.d.ts" />

const tabSpaces = "    ";
const tabWidth = tabSpaces.length;
const acCount = 11;

function setCaret(range: Range)
{
    let sel = window.getSelection();
    if (!sel) return;
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

    private lastText: string | null = null;
    private triggerOnTextChanged(): void
    {
        let newText = this.text;
        this.updateHighlight(newText); 
        if (this.lastText == newText)
            return;
        this.lastText = newText;
        this.onTextChanged(newText);
    }
    private onTextChanged: (text: string) => void;

    private getACitems: () => string[];
    
    private acState = {
        item: "",
        phrase: "",
        caretIndex: 0
    };

    private applyAC(): void
    {
        this.acSpan.hide();

        let range = document.createRange();

        let idStart = this.traceIndex(this.acState.caretIndex - this.acState.phrase.length, this.codeNative);
        range.setStart(idStart.node, idStart.index);
        let idEnd = this.traceIndex(this.acState.caretIndex, this.codeNative);
        range.setEnd(idEnd.node, idEnd.index);

        range.deleteContents();
        let acNode = document.createTextNode(this.acState.item);
        range.insertNode(acNode);
        range.setStartAfter(acNode);
        setCaret(range);
        this.triggerOnTextChanged();
    }

    public constructor(private highlight: boolean, onTextChanged: (text: string) => void, getACitems: () => string[], pre: JQuery = $("<pre>"))
    {
        this.onTextChanged = onTextChanged;
        this.getACitems = getACitems;

        this.pre = pre;
        this.pre.css("cursor", "text");

        this.codeNative = document.createElement("code");
        this.code = $(this.codeNative);
        this.code.css("background-color", "transparent");
        this.code.css("box-shadow", "none");
        this.code.css("padding", "0px");
        let wrapCode = $("<div>");
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
                let range = this.caretPosition;
                if (range != null)
                {
                    let text = this.text;
                    let startOffset = this.caretIndex(range);
                    let start = text.lastIndexOf("\n", startOffset - 1);
                    text = text.substring(start + 1, startOffset);
                    let insert = tabWidth - text.length % tabWidth;
                    let spacesNode = document.createTextNode(tabSpaces.substr(0, insert));
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
            // enter
            if (eo.which == 13)
            {
                eo.preventDefault();

                // AC enter
                if (this.acSpan.is(":visible"))
                    this.applyAC();
                else
                {
                    this.acSpan.hide();

                    let range: Range | null = this.caretPosition;
                    if (range == null) return;
                    range = range.cloneRange();

                    let breakNode = document.createTextNode("\n");
                    range.insertNode(breakNode);
                    range.setStartAfter(breakNode);
                    setCaret(range);
                    this.triggerOnTextChanged();
                }
            }
            // Ctrl+Space
            if (eo.which == 32 && eo.ctrlKey)
            {
                eo.preventDefault();
                this.showAC(0, true);
            }
            // console.log(eo.which);
        });
        this.code.keyup(eo =>
        {
            if ((eo.which == 37 || eo.which == 39) && this.acSpan.is(":visible"))
                this.acSpan.hide();
                //this.showAC();
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

    private traceIndex(index: number, node: Element): { index: number; node: Element }
    {
        if (node.nodeType == 3)
            return { index: Math.min(index, (node.textContent || '').length), node: node };
        let res: { index: number; node: Element } | null = null;
        let contents = $(node).contents();
        contents.each((i, e) =>
        {
            let elen = (e.textContent || '').length;
            if (res == null)
                if (elen <= index && i < contents.length - 1)
                    index -= elen;
                else
                    res = this.traceIndex(index, e);
        });
        if (res == null) throw 'debug me';
        return res;
    }
    private createCodeRange(start: number, length: number): JQuery
    {
        let begin = this.traceIndex(start, this.codeNative);
        let end = this.traceIndex(start + length, this.codeNative);
        
        let range = document.createRange();
        range.setStart(begin.node, begin.index);
        range.setEnd(end.node, end.index);

        // insert element
        let elem = $("<span>").text(range.toString());
        range.deleteContents();
        range.insertNode(elem[0]);
        return elem;
    }
    
    private debHLid: number | null = null;
    
    private _updateHighlight(text: string)
    {
        let saveCaret = this.caretIndex(this.caretPosition);

        // clear all formatting
        this.code.text(text);

        if (this.highlight)
        {
            // format
            let format = (regex: RegExp, formatter: (jq: JQuery) => void) =>
            {
                let match: RegExpExecArray | null;
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
                jq => jq.css("color", "hsl(100, 50%, 55%)").css("font-style", "italic"));
        }

        // restore caret
        let loc = this.traceIndex(saveCaret, this.codeNative);
        let range = document.createRange();
        range.setStart(loc.node, loc.index);
        setCaret(range);
    }
    private updateHighlight(text: string)
    {
        if (this.debHLid != null)
            clearTimeout(this.debHLid);
        this.debHLid = setTimeout(() => this._updateHighlight(text), 1000);
    }

    private get caretPosition(): Range | null
    {
        let range: Range;
        let container: HTMLElement;
        try
        {
            range = window.getSelection()!.getRangeAt(0);

            let cont : Node | null = range.startContainer;
            while (cont && cont.nodeType != 1)
                cont = cont.parentNode;
            let container = <HTMLElement>cont;

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
    private caretIndex(caretPosition: Range | null): number
    {
        if (caretPosition == null) return 0;
        let range = caretPosition.cloneRange();
        range.selectNodeContents(this.codeNative);
        range.setEnd(caretPosition.startContainer, caretPosition.startOffset);
        return range.toString().length;
    }

    private showAC(moveSelection: number = 0, explicit: boolean = false)
    {
        let codeText = this.text;
        
        // hide ac
        this.acSpan.hide();

        // get caret information
        let range: Range | null = this.caretPosition;
        if (range == null) return;
        range = range.cloneRange();

        // extract current identifier
        this.acState.caretIndex = this.caretIndex(range);
        let text = codeText.slice(0, this.acState.caretIndex);
        let vv = /[a-zA-Z_][a-zA-Z0-9_]*$/.exec(text);
        let v = vv == null ? "" : vv[0];
        if (v == "" && !explicit)
            return;
        this.acState.phrase = v;

        // - check for non-identifier fronts
        let indexBefore = this.acState.caretIndex - v.length - 1;
        if (indexBefore >= 0 && (text.charAt(indexBefore) == "\\" || text.charAt(indexBefore) == "\""))
            return;

        let idStart = this.traceIndex(this.acState.caretIndex - v.length, this.codeNative);
        range.setStart(idStart.node, idStart.index);

        let x: number, y: number;
        x = (range.getClientRects()[0].left | 0) + $(window).scrollLeft();
        y = (range.getClientRects()[0].top | 0) + $(window).scrollTop();

        // move AC span
        this.acSpan.css("left", x + "px");
        this.acSpan.css("top", y + "px");

        // get completion results
        let names = this.getACitems();
        // - add local names
        let regex = /\\[a-zA-Z_][a-zA-Z0-9_]*/g;
        while (vv = regex.exec(text))
            names.push(vv[0].substr(1));

        // - process
        let t = names.sort(compareStrings);
        t = t.filter((v, i) => i == 0 || v != t[i-1]); // distinct
        let result: { x: string; i: number }[] = [];
        let resultAny: { x: string; i: number }[] = [];
        let vLower = v.toLowerCase();
        let vLen = v.length;
        t.forEach(tt =>
        {
            let index = tt.toLowerCase().indexOf(vLower);
            if (index != -1)
                (index == 0 ? result : resultAny).push({ x: tt, i: index });
        });
        Array.prototype.push.apply(result, resultAny);

        if (result.length == 0)
            return;

        // handle/update lastACitem
        let indexs = result
            .map((x, i) => { return { x: x.x, i: i }; })
            .filter(t => t.x == this.acState.item)
            .map(t => t.i);

        let index = indexs.length == 0 ? 0 : indexs[0];
        index = (index + moveSelection + result.length) % result.length;
        this.acState.item = result[index].x;

        // display results
        let acListOffset = Math.max(Math.min(1 + index - (acCount / 2) | 0, result.length - acCount), 0);
        let hiddenFront = acListOffset > 0;
        let hiddenBack = result.length > acListOffset + acCount;

        result = result.slice(acListOffset, acListOffset + acCount);

        let boxShadow = "";
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
            let p = $("<p>").css("padding", "0px");
            p.append($("<span>").text(x.x.slice(0, x.i)));
            p.append($("<span>").text(x.x.slice(x.i, x.i + vLen)).css("color", "salmon"));
            p.append($("<span>").text(x.x.slice(x.i + vLen)));
            p.css("cursor", "pointer");
            p.click(() =>
            {
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
        let cl = this.code.clone();
        cl.find("br").replaceWith("\n");
        return cl.text();
    }

    public set text(text: string)
    {
        this.acSpan.hide();
        this.code.text(text);
        this.triggerOnTextChanged();
    }

}