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
  let result;
  if (x === 0n) {
    result = adt(2, 0);
  } else {
    result = adt(2, 1, () => fromNat(x - 1n)());
  }
  result().Nat = x;
  return result;
};
const fromList = x => {
  let result;
  if (x.length === 0) {
    result = adt(2, 0);
  } else {
    result = adt(2, 1, x.shift(), () => fromList(x)());
  }
  return result;
};
const fromString = x => fromList(x.split('').map(s => fromNat(BigInt(s.charCodeAt(0)))));

const toBool = f => f()(() => true)(() => false);
const toNat = f => {
  let n = 0n;
  while (true) {
    f = f();
    const hack = f.Nat;
    if (hack !== undefined) {
      // console.log("HIT", hack, n);
      return hack + n;
    }
    f = f(() => null)(() => x => x);
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
const _k = () => (a) => (b) => a();
const _s = () => (a) => (b) => (c) => a()(c)(() => b()(c));
const u = () => x => x()(_s)(_k);

let env = { u };

// Code gen start
`);

// Note: Admittedly, some of those hacks are strict,
// i.e. they change semantics in that they can result in non-termination
// when the un-hacked terms would not. E.g. reducing `Succ inf` would not hang, while now it does.
// This can be fixed however: By defining the original terms to be strict as well.
// See reflect.txt for sketch, and APPLY IT when you get the chance.
const hacks = {
  'Zero': `fromNat(0n)`,
  'Succ': `(Succ => () => n => {
    const nStrict = n();
    if ('Nat' in nStrict) return fromNat(nStrict.Nat + 1n)()
    return Succ()(n);
  })(env['Succ'])`,
  // 'add': `(add => () => a => b => {
  //   const aStrict = a();
  //   const bStrict = b();
  //   const res = add()(a)(b);
  //   if ('Nat' in aStrict && 'Nat' in bStrict) res.Nat = aStrict.Nat + bStrict.Nat;
  //   return res;
  // })(env['add'])`,
  'add': `(add => () => a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat + bStrict.Nat)()
    return add()(a)(b);
  })(env['add'])`,
  'sub': `(sub => () => a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat((aStrict.Nat - bStrict.Nat < 0n) ? 0n : (aStrict.Nat - bStrict.Nat))()
    return sub()(a)(b);
  })(env['sub'])`,
  'mul': `(mul => () => a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat * bStrict.Nat)()
    return mul()(a)(b);
  })(env['mul'])`,
  'pow': `(pow => () => a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat ** bStrict.Nat)()
    return pow()(a)(b);
  })(env['pow'])`,
  '_qadd': `(_qadd => () => a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat + 4n * bStrict.Nat)()
    return _qadd()(a)(b);
  })(env['_qadd'])`,
};

// when to populate .Nat within Succ?
//
// Succ (omega Zero)
// Succ (i Zero)
// Succ Zero
// Succ (i Inf)
// Succ Inf

// const types = { u: (((d -> (c -> b)) -> ((g -> c) -> (d^g -> b))) -> ((e -> (f -> e)) -> a)) -> a };



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
  // console.log(`env = Object.assign({ ${JSON.stringify(name)}: emit(env, ${JSON.stringify(expressionStack.pop())}) }, env);`);
  // end parse definition
  if (name in hacks) console.log(`env[${JSON.stringify(name)}] = ${hacks[name]};`);

  reader.readWhitespace();
}

console.log(`
// Code gen end

env['inf'] = () => env['y']()(env['Succ'])

console.log(toNat(fromNat(42n)));
console.log(toNat(() => env['add']()(env['three'])(env['three'])));
console.log(toNat(() => env['mul']()(env['three'])(env['three'])));
console.log(toNat(() => env['pow']()(env['three'])(env['three'])));
console.log(toString(() => env['strCons']()(env['newLine'])(env['empty'])));
console.log(toString(fromString("u u")));

// console.log(toBool(() => env['isLT']()(env['inf'])(env['three'])));
// console.log(toBool(() => env['isLT']()(env['three'])(env['inf'])));

// console.log(toList(env['ListEmpty']));
// console.log(JSON.stringify(toString(env['newLine'])));
// console.log(toString(fromString("Hello World")));
// console.log(toString(() => env['fullDebug']()(fromString("u u"))));


// token_Run = \s strFromMaybe token_String_list (token_Process s)

// console.log(toString(() => env['token_Run']()(fromString("u u"))));
console.log(toString(() => env['fullDebug']()(fromString("u u"))));
`);
