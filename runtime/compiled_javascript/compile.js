const fs = require("fs");

const fsOptions = { encoding: "utf-8" };

const prelude = fs.readFileSync(
  __dirname + "/../../www/library/prelude.native.txt",
  fsOptions
);
const preludeDef = fs.readFileSync(
  __dirname + "/../../www/library/prelude.txt",
  fsOptions
).split('\n').filter(x => x.length > 0 && !x.startsWith(`'`));
const preludeFiles = preludeDef.map(x => fs.readFileSync(
  __dirname + "/../../www/library/" + x,
  fsOptions
));

class StringReader {
  constructor(str) {
    this.str = str;
    this.index = 0;
    this.len = str.length;
  }

  readWhile(pred) {
    const start = this.index;
    while (this.index < this.len && pred(this.str[this.index])) this.index++;
    return this.str.slice(start, this.index);
  }

  readToken() {
    return this.readWhile(ch => /^[^ \n]$/.test(ch));
  }

  readChar(expected) {
    let b = true;
    return (
      this.readWhile(ch => {
        if (!b) return false;
        b = false;
        return ch == expected;
      }).length == 1
    );
  }

  get charsLeft() {
    return this.len - this.index;
  }
}

const DEBUG = false;

console.log(`
const DEBUG_STACK = [];

const lazy = ${DEBUG ? "name => " : ""}f => {
  let result = null;
  ${
    DEBUG
      ? `return name => {
  if (name === undefined) throw new Error('Pass callsite name');
  DEBUG_STACK.push(name);
  name && console.error(DEBUG_STACK);
  // name && console.count(name);
  const r = result || (result = f(name));
  DEBUG_STACK.pop();
  // console.error(new Error().stack);
  return r;
};`
      : `return () => result || (result = f());`
  }
};

// Marshalling
const swallow = (swallow, x) => {
  let result = x;
  while (swallow--) result = (result => _ => result)(result);
  return result;
};
const adt = (${DEBUG ? "name, " : ""}arity, index, ...args) => lazy${
  DEBUG ? "(``)" : ""
}((${
  DEBUG ? "name" : ""
}) => swallow(index, x => swallow(arity - index - 1, args.reduce((f, arg) => f(arg), x(${
  DEBUG ? '"BI-adt~" + name' : ""
})))));

const fromBool = x => x ? adt(${DEBUG ? "true, " : ""}2, 0) : adt(${
  DEBUG ? "false, " : ""
}2, 1);
const fromNat = x => {
  let result;
  if (x === 0n) {
    result = adt(${DEBUG ? "x, " : ""}2, 0);
  } else {
    result = adt(${DEBUG ? "x, " : ""}2, 1, (${
  DEBUG ? "name" : ""
}) => fromNat(x - 1n)(${DEBUG ? '"BI-fromList~" + name' : ""}));
  }
  result(${DEBUG ? '"BI-fromNat"' : ""}).Nat = x;
  return result;
};
const fromList = (x) => {
  let result;
  if (x.length === 0) {
    result = adt(${DEBUG ? "`list(${x.length})`, " : ""}2, 0);
  } else {
    result = adt(${DEBUG ? "`list(${x.length})`, " : ""}2, 1, x[0], (${
  DEBUG ? "name" : ""
}) => fromList(x.slice(1))(${DEBUG ? '"BI-fromList~" + name' : ""}));
  }
  result(${DEBUG ? '"BI-fromList"' : ""}).List = x;
  return result;
};
const fromString = x => fromList(x.split('').map(s => fromNat(BigInt(s.charCodeAt(0)))));

const toBool = f => f(${DEBUG ? '"BI-toBool"' : ""})(() => true)(() => false);
const toNat = f => {
  let n = 0n;
  while (true) {
    f = f(${DEBUG ? '"BI-toNat"' : ""});
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
    f = f(${DEBUG ? '"BI-toList"' : ""});
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
const _k = lazy${DEBUG ? '("u")' : ''}((${DEBUG ? 'name' : ''}) => a => b => a(${DEBUG ? 'name' : ''}));
const _s = lazy${DEBUG ? '("u")' : ''}((${DEBUG ? 'name' : ''}) => a => b => c => a(${DEBUG ? 'name' : ''})(c)(lazy((${DEBUG ? 'name2' : ''}) => b(${DEBUG ? 'name + "~" + name2' : ''})(c))));
const u = lazy${DEBUG ? '("u")' : ''}((${DEBUG ? 'name' : ''}) => x => x(${DEBUG ? 'name' : ''})(_s)(_k));

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
  // Core
  i: DEBUG_ARG => `x => x(${DEBUG_ARG})`,
  k: DEBUG_ARG => `x => y => x(${DEBUG_ARG})`,
  s: DEBUG_ARG => `a => b => c => a(${DEBUG_ARG})(c)(lazy((${DEBUG ? 'name2' : ''}) => b(${DEBUG ? DEBUG_ARG + ' + "~" + name2' : ''})(c)))`,
  b: DEBUG_ARG => `a => b => c => a(${DEBUG_ARG})(lazy((${DEBUG ? 'name2' : ''}) => b(${DEBUG ? DEBUG_ARG + ' + "~" + name2' : ''})(c)))`,
  c: DEBUG_ARG => `a => b => c => a(${DEBUG_ARG})(c)(b)`,

  // List
  // ListEmpty: DEBUG_ARG => `fromList([])(${DEBUG_ARG})`,
  // ListCons: DEBUG_ARG => `h => t => {
  //   const tStrict = t(${DEBUG_ARG});
  //   if ('List' in tStrict) return fromList([h].concat(tStrict.List))(${DEBUG_ARG})
  //   return self(${DEBUG_ARG})(h)(t);
  // }`,
  // reverse: DEBUG_ARG => `l => {
  //   const lStrict = l(${DEBUG_ARG});
  //   if ('List' in lStrict) return fromList(lStrict.List.slice().reverse())(${DEBUG_ARG})
  //   return self(${DEBUG_ARG})(l);
  // }`,

  // Nat
  Zero: DEBUG_ARG => `fromNat(0n)(${DEBUG_ARG})`,
  Succ: DEBUG_ARG => `n => {
    const nStrict = n(${DEBUG_ARG});
    if ('Nat' in nStrict) return fromNat(nStrict.Nat + 1n)(${DEBUG_ARG})
    return self(${DEBUG_ARG})(n);
  }`,
  // 'add': DEBUG_ARG => `a => b => {
  //   // oddly, this formulation results in non-termination of fullDebug
  //   const aStrict = a(${DEBUG_ARG});
  //   const bStrict = b(${DEBUG_ARG});
  //   const res = self(${DEBUG_ARG})(a)(b);
  //   if ('Nat' in aStrict && 'Nat' in bStrict) res.Nat = aStrict.Nat + bStrict.Nat;
  //   return res;
  // }`,
  add: DEBUG_ARG => `a => b => {
    const aStrict = a(${DEBUG_ARG});
    const bStrict = b(${DEBUG_ARG});
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat + bStrict.Nat)(${DEBUG_ARG})
    return self(${DEBUG_ARG})(a)(b);
  }`,
  sub: DEBUG_ARG => `a => b => {
    const aStrict = a(${DEBUG_ARG});
    const bStrict = b(${DEBUG_ARG});
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat((aStrict.Nat - bStrict.Nat < 0n) ? 0n : (aStrict.Nat - bStrict.Nat))(${DEBUG_ARG})
    return self(${DEBUG_ARG})(a)(b);
  }`,
  mul: DEBUG_ARG => `a => b => {
    const aStrict = a(${DEBUG_ARG});
    const bStrict = b(${DEBUG_ARG});
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat * bStrict.Nat)(${DEBUG_ARG})
    return self(${DEBUG_ARG})(a)(b);
  }`,
  pow: DEBUG_ARG => `a => b => {
    const aStrict = a(${DEBUG_ARG});
    const bStrict = b(${DEBUG_ARG});
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat ** bStrict.Nat)(${DEBUG_ARG})
    return self(${DEBUG_ARG})(a)(b);
  }`,
  _qadd: DEBUG_ARG => `a => b => {
    const aStrict = a(${DEBUG_ARG});
    const bStrict = b(${DEBUG_ARG});
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat + 4n * bStrict.Nat)(${DEBUG_ARG})
    return self(${DEBUG_ARG})(a)(b);
  }`
};

// type Expression = string | [Expression, Expression];
const printExpr = (name, strict, e) =>
  typeof e === "string"
    ? strict
      ? `${printExpr(name, false, e)}(${DEBUG ? JSON.stringify(name) : ""})`
      : `env[${JSON.stringify(e)}]`
    : strict
    ? `${printExpr(name + "0", true, e[0])}(${printExpr(
        name + "1",
        false,
        e[1]
      )})`
    : `lazy${DEBUG ? `(${JSON.stringify(name)})` : ""}(() => ${printExpr(
        name,
        true,
        e
      )})`;
const reader = new StringReader(prelude);
const expressionStack = [];
while (reader.charsLeft > 0) {
  // begin parse definition
  const name = reader.readToken();
  const term = reader.readChar(' ');
  const def = reader.readChar('\n');
  if (name === '') {
    const b = expressionStack.pop();
    const a = expressionStack.pop();
    expressionStack.push([a, b]);
  }
  else {
    if (term) {
      expressionStack.push(name);
    } else {
      console.log(
        `env = Object.assign({ ${JSON.stringify(name)}: (env => ${printExpr(
          name,
          false,
          expressionStack.pop()
        )})(env) }, env);`
      );
      // console.log(`env = Object.assign({ ${JSON.stringify(name)}: emit(env, ${JSON.stringify(expressionStack.pop())}) }, env);`);
      // end parse definition
      if (name in hacks)
        console.log(
          `env[${JSON.stringify(name)}] = (self => lazy${
            DEBUG ? `(${JSON.stringify(name)})` : ""
          }(() => (${hacks[name](
            DEBUG ? JSON.stringify("H-" + name) : ""
          )})))(env[${JSON.stringify(name)}]);`
        );
    }
  }
}

function splitSources(sources) {
    var result = [];

    var lines = sources.split("\n");
    var index = 0;

    while (index < lines.length)
    {
        var stmt = lines[index].split("'")[0];
        index++;
        while (index < lines.length && lines[index][0] == " ")
        {
            stmt += "\n" + lines[index].split("'")[0];
            index++;
        }
        if (stmt.trim() != "")
            result.push(stmt);
    }

    return result;
}

// const s = 'Bool = True | False';
// console.log(`
// console.log(toString((name) => env['fullDebug'](name)(fromString(${JSON.stringify(s)}))));
// `);
// process.exit(0);

console.log(`let native = '';`);

for (const file of preludeFiles) {
  for (const part of splitSources(file)) {
    console.log(`
native += toString((name) => env['pipe'](name)(fromString(${JSON.stringify(part)})));
process.stderr.write('.');
`.trim() + '\n');
    // console.error(part);
  }
}

console.log(`require('fs').writeFileSync(
  __dirname + "/../../www/library/prelude.native.txt",
  native + '\\n');`);

process.exit(0);

console.log(`
// Code gen end

// env['inf'] = (name) => env['y'](name)(env['Succ']);

// env['s']('TOP')(env['k'])(env['k'])(env['k'])
// process.exit(0);

// console.log(toNat(fromNat(42n)));
// console.log(toNat((name) => env['add'](name)(env['three'])(env['three'])));
// console.log(toNat((name) => env['mul'](name)(env['three'])(env['three'])));
// console.log(toNat((name) => env['pow'](name)(env['three'])(env['three'])));
// console.log(toNat((name) => env['pow'](name)(env['Zero'])(env['Zero'])));
// console.log(toString((name) => env['strCons'](name)(env['newLine'])(env['empty'])));

// console.log(toBool((name) => env['isLT'](name)(env['inf'])(env['three'])));
// console.log(toBool((name) => env['isLT'](name)(env['three'])(env['inf'])));

// console.log(toList(env['ListEmpty']));
// console.log(JSON.stringify(toString(env['newLine'])));
// console.log(toString(fromString("Hello World")));
// console.log(toString((name) => env['fullDebug'](name)(fromString("u u"))));


// token_Run = \s strFromMaybe token_String_list (token_Process s)

// console.log(toString(fromString("pow = \\\\n \\\\m m one (\\\\dm mul n (pow n dm))")));
// console.log(toString((name) => env['fullDebug'](name)(fromString("u u"))));
// console.log(toString((name) => env['fullDebug'](name)(fromString("\\\\n \\\\m m"))));
// console.log(toString((name) => env['token_Run'](name)(fromString("pow = \\\\n \\\\m m one (\\\\dm mul n (pow n dm))"))));
// console.log(toString((name) => env['fullDebug'](name)(fromString("\\\\n \\\\m m one (\\\\dm mul n (pow n dm))"))));
console.log(toString((name) => env['pipe'](name)(fromString("\\\\n \\\\m m one (\\\\dm mul n (pow n dm))"))));
`);
