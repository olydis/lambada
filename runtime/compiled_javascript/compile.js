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

const DEBUG = true;

console.log(`
const lazy = ${DEBUG ? 'name => ' : ''}f => {
  let result = null;
  return () => result || (result = (${DEBUG ? 'console.count(name), ' : ''}f()));
};

// Marshalling
const swallow = (swallow, x) => {
  let result = x;
  while (swallow--) result = (result => _ => result)(result);
  return result;
};
const adt = (${DEBUG ? 'name, ' : ''}arity, index, ...args) => lazy${DEBUG ? '(``)' : ''}(() => swallow(index, x => swallow(arity - index - 1, args.reduce((f, arg) => f(arg), x()))));

const fromBool = x => x ? adt(${DEBUG ? 'true, ' : ''}2, 0) : adt(${DEBUG ? 'false, ' : ''}2, 1);
const fromNat = x => {
  let result;
  if (x === 0n) {
    result = adt(${DEBUG ? 'x, ' : ''}2, 0);
  } else {
    result = adt(${DEBUG ? 'x, ' : ''}2, 1, () => fromNat(x - 1n)());
  }
  result().Nat = x;
  return result;
};
const fromList = (x) => {
  let result;
  if (x.length === 0) {
    result = adt(${DEBUG ? '`list(${x.length})`, ' : ''}2, 0);
  } else {
    result = adt(${DEBUG ? '`list(${x.length})`, ' : ''}2, 1, x[0], () => fromList(x.slice(1))());
  }
  result().List = x;
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
      return n + hack;
    }
    f = f(() => null)(() => x => x);
    if (f === null) return n;
    n++;
  }
};
const toList = f => {
  const l = [];
  while (true) {
    f = f();
    const hack = f.List;
    if (hack !== undefined) {
      // console.log("HIT", hack, n);
      return l.concat(hack);
    }
    f = f(() => null)(() => h => t => [h, t]);
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

// Note: Admittedly, some of those hacks are strict,
// i.e. they change semantics in that they can result in non-termination
// when the un-hacked terms would not. E.g. reducing `Succ inf` would not hang, while now it does.
// This can be fixed however: By defining the original terms to be strict as well.
// See reflect.txt for sketch, and APPLY IT when you get the chance.
//
// Another example: when to populate .Nat within Succ, if Succ is not strict?
//
// Succ (omega Zero)      => evaluating param to HNF would mean non-term here
// Succ (i Zero)          => but not evaluating would not detect this as 0
// Succ Zero
// Succ (i Inf)
// Succ Inf
const hacks = {
  // List
  'ListEmpty': `fromList([])()`,
  'ListCons': `h => t => {
    const tStrict = t();
    if ('List' in tStrict) return fromList([h].concat(tStrict.List))()
    return self()(h)(t);
  }`,
  'reverse': `l => {
    const lStrict = l();
    if ('List' in lStrict) return fromList(lStrict.List.slice().reverse())()
    return self()(l);
  }`,

  // Nat
  'Zero': `fromNat(0n)()`,
  'Succ': `n => {
    const nStrict = n();
    if ('Nat' in nStrict) return fromNat(nStrict.Nat + 1n)()
    return self()(n);
  }`,
  // 'add': `a => b => {
  //   // oddly, this formulation results in non-termination of fullDebug
  //   const aStrict = a();
  //   const bStrict = b();
  //   const res = self()(a)(b);
  //   if ('Nat' in aStrict && 'Nat' in bStrict) res.Nat = aStrict.Nat + bStrict.Nat;
  //   return res;
  // }`,
  'add': `a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat + bStrict.Nat)()
    return self()(a)(b);
  }`,
  'sub': `a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat((aStrict.Nat - bStrict.Nat < 0n) ? 0n : (aStrict.Nat - bStrict.Nat))()
    return self()(a)(b);
  }`,
  'mul': `a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat * bStrict.Nat)()
    return self()(a)(b);
  }`,
  'pow': `a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat ** bStrict.Nat)()
    return self()(a)(b);
  }`,
  '_qadd': `a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat + 4n * bStrict.Nat)()
    return self()(a)(b);
  }`,
};


// type Expression = string | [Expression, Expression];
const printExpr = (name, strict, e) => typeof e === 'string'
  ? (strict ? `${printExpr(name, false, e)}()` : `env[${JSON.stringify(e)}]`)
  : (strict ? `${printExpr(name + '0', true, e[0])}(${printExpr(name + '1', false, e[1])})` : `lazy${DEBUG ? `(${JSON.stringify(name)})` : ''}(() => ${printExpr(name, true, e)})`);
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
  console.log(`env = Object.assign({ ${JSON.stringify(name)}: (env => ${printExpr(name, false, expressionStack.pop())})(env) }, env);`);
  // console.log(`env = Object.assign({ ${JSON.stringify(name)}: emit(env, ${JSON.stringify(expressionStack.pop())}) }, env);`);
  // end parse definition
  if (name in hacks) console.log(`env[${JSON.stringify(name)}] = (self => lazy${DEBUG ? `(${JSON.stringify(name)})` : ''}(() => (${hacks[name]})))(env[${JSON.stringify(name)}]);`);

  reader.readWhitespace();
}

console.log(`
// Code gen end

env['inf'] = () => env['y']()(env['Succ'])

console.log(toNat(fromNat(42n)));
console.log(toNat(() => env['add']()(env['three'])(env['three'])));
console.log(toNat(() => env['mul']()(env['three'])(env['three'])));
console.log(toNat(() => env['pow']()(env['three'])(env['three'])));
console.log(toNat(() => env['pow']()(env['Zero'])(env['Zero'])));
console.log(toString(() => env['strCons']()(env['newLine'])(env['empty'])));

// console.log(toBool(() => env['isLT']()(env['inf'])(env['three'])));
// console.log(toBool(() => env['isLT']()(env['three'])(env['inf'])));

// console.log(toList(env['ListEmpty']));
// console.log(JSON.stringify(toString(env['newLine'])));
// console.log(toString(fromString("Hello World")));
// console.log(toString(() => env['fullDebug']()(fromString("u u"))));


// token_Run = \s strFromMaybe token_String_list (token_Process s)

console.log(toString(fromString("pow = \\\\n \\\\m m one (\\\\dm mul n (pow n dm))")));
console.log(toString(() => env['fullDebug']()(fromString("u u"))));
console.log(toString(() => env['fullDebug']()(fromString("\\\\n \\\\m m"))));
// console.log(toString(() => env['token_Run']()(fromString("pow = \\\\n \\\\m m one (\\\\dm mul n (pow n dm))"))));
console.log(toString(() => env['fullDebug']()(fromString("\\\\n \\\\m m one (\\\\dm mul n (pow n dm))"))));
`);
