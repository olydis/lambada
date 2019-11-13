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
const lazy = f => {
  let result = null;
  return () => result || (result = f());
};

// Marshalling
const swallow = (swallow, x) => {
  let result = x;
  while (swallow--) result = (result => _ => result)(result);
  return result;
};
const adt = (arity, index, ...args) => lazy(() => swallow(index, x => swallow(arity - index - 1, args.reduce((f, arg) => f(arg), x()))));

const fromBool = x => x ? adt(2, 0) : adt(2, 1);
const fromNat = x => {
  let result = adt(2, 0);
  result().Nat = 0n;
  for (let i = 1n; i <= x; i++) {
    result = adt(2, 1, result);
    result().Nat = i;
  }
  return result;
};
const fromList = x => {
  let result = adt(2, 0);
  while (x.length) result = adt(2, 1, x.pop(), result);
  return result;
};
const fromString = x => fromList(x.split('').map(s => fromNat(s.charCodeAt(0))));

const toBool = f => f()(() => true)(() => false);
const toNat = f => {
  let n = 0n;
  while (true) {
    const hack = f().Nat;
    if (hack !== undefined) {
      console.log("HIT", hack, n);
      return hack + n;
    }
    f = f()(() => null)(() => x => x);
    if (f === null) return n;
    n++;
  }
};
const toList = f => {
  const l = [];
  while (true) {
    f = f()(() => null)(() => h => t => [h, t]);
    if (f === null) return l;
    l.push(f[0]);
    f = f[1];
  }
};
const toString = f => toList(f).map(c => String.fromCharCode(Number(toNat(c)))).join('');

// Singularity
const _k = () => a => b => a();
const _s = () => a => b => c => a()(c)(() => b()(c));
const u = () => x => x()(_s)(_k);

let env = { u };

// Code gen start
`);

const hacks = {
  'Zero': `fromNat(0n)`,
  // 'one': `fromNat(1n)`,
  // 'two': `fromNat(2n)`,
  // 'three': `fromNat(3n)`,
  'Succ': `(Succ => () => n => {

    const res = Succ()(n);
    if ('Nat' in n) return fromNat(n.Nat + 1n)();
    return res;
  })(env['Succ'])`,
};

// when to populate .Nat within Succ?
//
// Succ (omega Zero)
// Succ (i Zero)
// Succ Zero
// Succ (i Inf)
// Succ Inf



// type Expression = string | [Expression, Expression];
const printExpr = (strict, e) => typeof e === 'string'
  ? (strict ? `${printExpr(false, e)}()` : `env[${JSON.stringify(e)}]`)
  : (strict ? `${printExpr(true, e[0])}(${printExpr(false, e[1])})` : `lazy(() => ${printExpr(true, e)})`);
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
  console.log(`env = Object.assign({ ${JSON.stringify(name)}: (env => ${printExpr(false, expressionStack.pop())})(env) }, env);`);
  // end parse definition
  if (name in hacks) console.log(`env[${JSON.stringify(name)}] = ${hacks[name]};`);

  reader.readWhitespace();
}

console.log(`
// Code gen end

env['inf'] = () => env['y']()(env['Succ'])

console.log(toNat(fromNat(42)));
console.log(toNat(() => env['add']()(env['three'])(env['three'])));
console.log(toNat(() => env['mul']()(env['three'])(env['three'])));
console.log(toNat(() => env['pow']()(env['three'])(env['three'])));

// console.log(toBool(() => env['isLT']()(env['inf'])(env['three'])));
console.log(toBool(() => env['isLT']()(env['three'])(env['inf'])));

// console.log(toList(env['ListEmpty']));
// console.log(JSON.stringify(toString(env['newLine'])));
// console.log(toString(fromString("Hello World")));
// console.log(toString(() => env['fullDebug']()(fromString("u u"))));
// console.log(toString(() => env['fullDebug']()(fromString("u u"))));
`);


applyList = \f \l l f (\h \t applyList (f h) t)
swallow = \f \arity arity f (b k (swallow f))
agt = \arity \index \args (swallow (\f swallow (applyList f args) (sub arity $ Succ index)) index)



agt 2 1 [65, "qwe"]
(swallow (\f swallow (applyList f [65, "qwe"]) Zero) 1)
(swallow (\f applyList f [65, "qwe"]) 1)
(swallow (\f f 65 "qwe") 1)

'applyList f [65, "qwe"] =
'applyList (f 65) ["qwe"]

strEquals (swallow (\f applyList f [65, "qwe"]) 1) "Aqwe"

' BUG IN AGT DETECTION IN JS!

\a \b b 65 "qwe"
\a \b i (b 65) "qwe"
