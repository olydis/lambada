const fs = require("fs");

const prelude = fs.readFileSync(__dirname + "/../../docs/library/prelude.native.txt", { encoding: 'utf-8' });

class StringReader {
  constructor(str) {
    this.str = str;
    this.index = 0;
    this.len = str.length;
  }

  readWhile(pred) {
    const start = this.index;
    while (this.index < this.len && pred(this.str[this.index]))
      this.index++;
    return this.str.slice(start, this.index);
  }

  readWhitespace() {
    return this.readWhile(ch => /^\s$/.test(ch));
  }

  readToken() {
    return this.readWhile(ch => /^[a-zA-Z0-9_]$/.test(ch));
  }

  readChar(expected) {
    let b = true;
    return this.readWhile(ch => {
      if (!b) return false;
      b = false;
      return ch == expected;
    }).length == 1;
  }

  get charsLeft() {
    return this.len - this.index;
  }
}

console.log(`
const _s = a => b => c => a(c)(b(c));
const _k = a => b => a;
const u = x => x(_s)(_k);

const lazy = f => {
  let result = null;
  return () => result || (result = f());
};

let env = { u };
`);

// type Expression = string | [Expression, Expression];
const printExpr = e => typeof e === 'string'
  ? `env[${JSON.stringify(e)}]`
  : `${printExpr(e[0])}(${printExpr(e[1])})`;
const reader = new StringReader(prelude);
reader.readWhitespace();
while (reader.charsLeft > 0) {
  // begin parse definition
  const name = reader.readToken();
  const expressionStack = [];
  while (true) {
    reader.readWhitespace();

    // apply
    if (reader.readChar(".")) {
      if (expressionStack.length < 2)
        break;
      const b = expressionStack.pop();
      const a = expressionStack.pop();
      expressionStack.push([a, b]);
      continue;
    }

    expressionStack.push(reader.readToken());
  }
  console.log(`env = Object.assign(
    (
      f => ({ ${JSON.stringify(name)}: x => f()(x) })
    )
      (
      (env => lazy(() => ${printExpr(expressionStack.pop())}))
        (env)
      ),
    env);
`);
  // end parse definition

  reader.readWhitespace();
}

console.lop(`
const toBool = f => f(true)(false);
const toNat = f => {
  let n = 0n;
  while (true) {
    f = f(null)(x => x);
    if (f === null) return n;
    n++;
  }
};
const toList = f => {
  const l = [];
  while (true) {
    f = f(null)(h => t => [h, t]);
    if (f === null) return l;
    l.push(f[0]);
    f = f[1];
  }
};
`)
