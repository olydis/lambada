
const DEBUG_STACK = [];

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
const fromList = (x) => {
  let result;
  if (x.length === 0) {
    result = adt(2, 0);
  } else {
    result = adt(2, 1, x[0], () => fromList(x.slice(1))());
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
const _k = lazy(() => a => b => a());
const _s = lazy(() => a => b => c => a()(c)(lazy(() => b()(c))));
const u = lazy(() => x => x()(_s)(_k));

let env = { u };

// Code gen start

env = Object.assign({ "i": (env => lazy(() => env["u"]()(env["u"])))(env) }, env);
env["i"] = (self => lazy(() => (x => x())))(env["i"]);
env = Object.assign({ "k": (env => lazy(() => env["u"]()(lazy(() => env["u"]()(env["i"])))))(env) }, env);
env["k"] = (self => lazy(() => (x => y => x())))(env["k"]);
env = Object.assign({ "s": (env => lazy(() => env["u"]()(env["k"])))(env) }, env);
env["s"] = (self => lazy(() => (a => b => c => a()(c)(lazy(() => b()(c))))))(env["s"]);
env = Object.assign({ "b": (env => lazy(() => env["s"]()(lazy(() => env["k"]()(env["s"])))(env["k"])))(env) }, env);
env["b"] = (self => lazy(() => (a => b => c => a()(lazy(() => b()(c))))))(env["b"]);
env = Object.assign({ "c": (env => lazy(() => env["s"]()(lazy(() => env["s"]()(lazy(() => env["k"]()(env["s"])))(lazy(() => env["s"]()(lazy(() => env["k"]()(env["k"])))(env["s"])))))(lazy(() => env["k"]()(env["k"])))))(env) }, env);
env["c"] = (self => lazy(() => (a => b => c => a()(c)(b))))(env["c"]);
env = Object.assign({ "m": (env => lazy(() => env["s"]()(env["i"])(env["i"])))(env) }, env);
env = Object.assign({ "y": (env => lazy(() => env["b"]()(env["m"])(lazy(() => env["c"]()(env["b"])(lazy(() => env["s"]()(env["i"])(env["i"])))))))(env) }, env);
env = Object.assign({ "i": (env => env["i"])(env) }, env);
env["i"] = (self => lazy(() => (x => x())))(env["i"]);
env = Object.assign({ "k": (env => env["k"])(env) }, env);
env["k"] = (self => lazy(() => (x => y => x())))(env["k"]);
env = Object.assign({ "s": (env => env["s"])(env) }, env);
env["s"] = (self => lazy(() => (a => b => c => a()(c)(lazy(() => b()(c))))))(env["s"]);
env = Object.assign({ "b": (env => env["b"])(env) }, env);
env["b"] = (self => lazy(() => (a => b => c => a()(lazy(() => b()(c))))))(env["b"]);
env = Object.assign({ "c": (env => env["c"])(env) }, env);
env["c"] = (self => lazy(() => (a => b => c => a()(c)(b))))(env["c"]);
env = Object.assign({ "m": (env => lazy(() => env["s"]()(env["i"])(env["i"])))(env) }, env);
env = Object.assign({ "y": (env => lazy(() => env["b"]()(env["m"])(lazy(() => env["c"]()(env["b"])(lazy(() => env["s"]()(env["i"])(env["i"])))))))(env) }, env);
env = Object.assign({ "True": (env => env["k"])(env) }, env);
env = Object.assign({ "True_Dispatch": (env => lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "False": (env => lazy(() => env["k"]()(env["i"])))(env) }, env);
env = Object.assign({ "False_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(env) }, env);
env = Object.assign({ "if": (env => env["i"])(env) }, env);
env = Object.assign({ "not": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["False"])))(env["True"])))(env) }, env);
env = Object.assign({ "lAnd": (env => lazy(() => env["c"]()(env["c"])(env["False"])))(env) }, env);
env = Object.assign({ "lOr": (env => lazy(() => env["c"]()(env["i"])(env["True"])))(env) }, env);
env = Object.assign({ "implies": (env => lazy(() => env["c"]()(env["c"])(env["True"])))(env) }, env);
env = Object.assign({ "xor": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["if"])))(env["not"])))))(env["i"])))(env) }, env);
env = Object.assign({ "eq": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["not"])))(env["xor"])))(env) }, env);
env = Object.assign({ "Zero": (env => env["k"])(env) }, env);
env["Zero"] = (self => lazy(() => (fromNat(0n)())))(env["Zero"]);
env = Object.assign({ "Zero_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(env["k"])))(env) }, env);
env = Object.assign({ "Succ": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env["Succ"] = (self => lazy(() => (n => {
    const nStrict = n();
    if ('Nat' in nStrict) return fromNat(nStrict.Nat + 1n)()
    return self()(n);
  })))(env["Succ"]);
env = Object.assign({ "Succ_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(env) }, env);
env = Object.assign({ "one": (env => lazy(() => env["Succ"]()(env["Zero"])))(env) }, env);
env = Object.assign({ "two": (env => lazy(() => env["Succ"]()(env["one"])))(env) }, env);
env = Object.assign({ "three": (env => lazy(() => env["Succ"]()(env["two"])))(env) }, env);
env = Object.assign({ "pred": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["Zero"])))(env["i"])))(env) }, env);
env = Object.assign({ "isZero": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["True"])))(lazy(() => env["k"]()(env["False"])))))(env) }, env);
env = Object.assign({ "add": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(lazy(() => env["c"]()(env["b"])(env["Succ"])))))))(env) }, env);
env["add"] = (self => lazy(() => (a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat + bStrict.Nat)()
    return self()(a)(b);
  })))(env["add"]);
env = Object.assign({ "sub": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(lazy(() => env["c"]()(env["b"])(env["pred"])))))))(env) }, env);
env["sub"] = (self => lazy(() => (a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat((aStrict.Nat - bStrict.Nat < 0n) ? 0n : (aStrict.Nat - bStrict.Nat))()
    return self()(a)(b);
  })))(env["sub"]);
env = Object.assign({ "mul": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["Zero"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(env["add"])))))))))(env) }, env);
env["mul"] = (self => lazy(() => (a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat * bStrict.Nat)()
    return self()(a)(b);
  })))(env["mul"]);
env = Object.assign({ "pow": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["one"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(env["mul"])))))))))(env) }, env);
env["pow"] = (self => lazy(() => (a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat ** bStrict.Nat)()
    return self()(a)(b);
  })))(env["pow"]);
env = Object.assign({ "_qadd": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["add"])))(lazy(() => env["mul"]()(lazy(() => env["Succ"]()(env["three"])))))))(env) }, env);
env["_qadd"] = (self => lazy(() => (a => b => {
    const aStrict = a();
    const bStrict = b();
    if ('Nat' in aStrict && 'Nat' in bStrict) return fromNat(aStrict.Nat + 4n * bStrict.Nat)()
    return self()(a)(b);
  })))(env["_qadd"]);
env = Object.assign({ "isEQ": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["lAnd"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["isZero"])))(env["sub"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["isZero"])))(lazy(() => env["c"]()(env["sub"])))))))(env) }, env);
env = Object.assign({ "isLTE": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["isZero"])))(env["sub"])))(env) }, env);
env = Object.assign({ "isGTE": (env => lazy(() => env["c"]()(env["isLTE"])))(env) }, env);
env = Object.assign({ "isLT": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["not"])))(env["isGTE"])))(env) }, env);
env = Object.assign({ "isGT": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["not"])))(env["isLTE"])))(env) }, env);
env = Object.assign({ "min": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(env["isLT"])))))(env["i"])))))(env["i"])))(env) }, env);
env = Object.assign({ "max": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(env["isGT"])))))(env["i"])))))(env["i"])))(env) }, env);
env = Object.assign({ "diff": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(env["isLT"])))))(lazy(() => env["c"]()(env["sub"])))))))(env["sub"])))(env) }, env);
env = Object.assign({ "mod": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(env["isLT"])))))(env["i"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["b"])))(env["sub"])))))))(env["i"])))))))(env) }, env);
env = Object.assign({ "div": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(env["isLT"])))))(env["Zero"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["Succ"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["b"])))(env["sub"])))))))(env["i"])))))))))(env) }, env);
env = Object.assign({ "Pair": (env => lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "Pair_Dispatch": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "fst": (env => lazy(() => env["c"]()(env["i"])(env["k"])))(env) }, env);
env = Object.assign({ "snd": (env => lazy(() => env["c"]()(env["i"])(lazy(() => env["k"]()(env["i"])))))(env) }, env);
env = Object.assign({ "changeFst": (env => lazy(() => env["c"]()(env["b"])(lazy(() => env["b"]()(env["Pair"])))))(env) }, env);
env = Object.assign({ "changeSnd": (env => lazy(() => env["c"]()(env["b"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["Pair"])))))))(env) }, env);
env = Object.assign({ "ListEmpty": (env => env["k"])(env) }, env);
env = Object.assign({ "ListEmpty_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))(env) }, env);
env = Object.assign({ "ListCons": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(env) }, env);
env = Object.assign({ "ListCons_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(env) }, env);
env = Object.assign({ "listIsEmpty": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["True"])))(lazy(() => env["k"]()(lazy(() => env["k"]()(env["False"])))))))(env) }, env);
env = Object.assign({ "listIsNotEmpty": (env => lazy(() => env["b"]()(env["not"])(env["listIsEmpty"])))(env) }, env);
env = Object.assign({ "head": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["i"])))(env["k"])))(env) }, env);
env = Object.assign({ "tail": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["i"])))(lazy(() => env["k"]()(env["i"])))))(env) }, env);
env = Object.assign({ "foldl": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(env["b"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(env["c"])))))))(lazy(() => env["c"]()(env["i"])))))))))))))(env["i"])))))))(env) }, env);
env = Object.assign({ "foldr": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(env["b"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(env["b"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(env["c"])))))))))))(env) }, env);
env = Object.assign({ "reverseBag": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(env["s"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(env["c"])))))(lazy(() => env["c"]()(env["ListCons"])))))))))(env) }, env);
env = Object.assign({ "reverse": (env => lazy(() => env["c"]()(env["reverseBag"])(env["ListEmpty"])))(env) }, env);
env = Object.assign({ "unfold": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(env["ListCons"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["b"])))(lazy(() => env["c"]()(env["i"])))))))))(env["i"])))))))(env) }, env);
env = Object.assign({ "repeat": (env => lazy(() => env["c"]()(env["unfold"])(env["i"])))(env) }, env);
env = Object.assign({ "listConcat": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["ListCons"])))))))(env["c"])))))))(env) }, env);
env = Object.assign({ "listReturn": (env => lazy(() => env["c"]()(env["ListCons"])(env["ListEmpty"])))(env) }, env);
env = Object.assign({ "listAddBack": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["listConcat"])))(lazy(() => env["c"]()(env["ListCons"])(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "cfold": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(env["ListCons"])))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(env["c"])))))))(lazy(() => env["c"]()(env["i"])))))))))))))(env["i"])))))))))(env) }, env);
env = Object.assign({ "take": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(env["ListCons"])))))))(env["c"])))))))))(env) }, env);
env = Object.assign({ "takeWhile": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))))(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["b"]()(env["not"])))))))(env["ListEmpty"])))))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["ListCons"])))))))))))))(env) }, env);
env = Object.assign({ "replicate": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["take"])))(env["repeat"])))(env) }, env);
env = Object.assign({ "listBind": (env => lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["foldl"])(env["ListEmpty"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["listConcat"])))))))(env) }, env);
env = Object.assign({ "map": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(env["ListCons"])))))))))))))(env) }, env);
env = Object.assign({ "filter": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(env["if"])))))(env["ListCons"])))))(env["i"])))))))))))))(env) }, env);
env = Object.assign({ "drop": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["b"])))))))(env["c"])))))))))(env) }, env);
env = Object.assign({ "dropWhile": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))))(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["b"]()(env["not"])))))))))))))))))))(env) }, env);
env = Object.assign({ "any": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["not"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["listIsEmpty"])))(env["filter"])))))(env) }, env);
env = Object.assign({ "all": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["not"])))(lazy(() => env["b"]()(env["any"])(lazy(() => env["b"]()(env["not"])))))))(env) }, env);
env = Object.assign({ "or": (env => lazy(() => env["any"]()(env["i"])))(env) }, env);
env = Object.assign({ "and": (env => lazy(() => env["all"]()(env["i"])))(env) }, env);
env = Object.assign({ "length": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["foldl"])(env["Zero"])))(lazy(() => env["b"]()(env["k"])(env["Succ"])))))(env) }, env);
env = Object.assign({ "zipWith": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["ListCons"])))))))))))))))))))))(env) }, env);
env = Object.assign({ "zip": (env => lazy(() => env["zipWith"]()(env["Pair"])))(env) }, env);
env = Object.assign({ "listZipLonger": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(env["b"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["map"])))(lazy(() => env["c"]()(env["i"])))))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["b"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["map"])))(lazy(() => env["c"]()(env["c"])))))))))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["ListCons"])))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["c"])))))))))))))))))(env) }, env);
env = Object.assign({ "listEquals": (env => lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["lAnd"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["isEQ"])(env["length"])))))(env["length"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["and"])))))(env["zipWith"])))))(env) }, env);
env = Object.assign({ "listMerge": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(env["s"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["c"]()(env["i"])))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))))))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["ListCons"])))))))))(lazy(() => env["b"]()(env["c"])))))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(env["ListCons"])))))))))))))))))(env) }, env);
env = Object.assign({ "listSort": (env => lazy(() => env["y"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["if"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["isGT"])(env["length"])))(env["one"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))))(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(env["listMerge"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(env["b"])))))))(lazy(() => env["c"]()(env["take"])))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(env["b"])))))))(lazy(() => env["c"]()(env["drop"])))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["div"])(env["length"])))(env["two"])))))))))))(env["i"])))))(env) }, env);
env = Object.assign({ "intSort": (env => lazy(() => env["listSort"]()(env["isLT"])))(env) }, env);
env = Object.assign({ "listElementAt": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["head"])))(lazy(() => env["c"]()(env["drop"])))))(env) }, env);
env = Object.assign({ "listStartsWith": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(env["listEquals"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["take"])(env["length"])))))))))))(env["i"])))(env) }, env);
env = Object.assign({ "listJoin": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["foldl"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["listConcat"])))(lazy(() => env["c"]()(env["listConcat"])))))))))(env) }, env);
env = Object.assign({ "strIsEmpty": (env => lazy(() => env["i"]()(env["listIsEmpty"])))(env) }, env);
env = Object.assign({ "strIsNotEmpty": (env => lazy(() => env["i"]()(env["b"])(env["not"])(env["strIsEmpty"])))(env) }, env);
env = Object.assign({ "strEmpty": (env => lazy(() => env["i"]()(env["ListEmpty"])))(env) }, env);
env = Object.assign({ "strCons": (env => lazy(() => env["i"]()(env["listConcat"])))(env) }, env);
env = Object.assign({ "strStartsWith": (env => lazy(() => env["i"]()(env["listStartsWith"])(env["isEQ"])))(env) }, env);
env = Object.assign({ "strJoin": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["foldl"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strCons"])))(lazy(() => env["c"]()(env["strCons"])))))))))(env) }, env);
env = Object.assign({ "strConss": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["ListEmpty"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["foldl"])))))(env["strCons"])))))(env) }, env);
env = Object.assign({ "strEquals": (env => lazy(() => env["listEquals"]()(env["isEQ"])))(env) }, env);
env = Object.assign({ "Just": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "Just_Dispatch": (env => lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "Nothing": (env => lazy(() => env["k"]()(env["i"])))(env) }, env);
env = Object.assign({ "Nothing_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))))(env) }, env);
env = Object.assign({ "maybeReturn": (env => env["Just"])(env) }, env);
env = Object.assign({ "maybeNothing": (env => env["Nothing"])(env) }, env);
env = Object.assign({ "maybeHasValue": (env => lazy(() => env["Just_Dispatch"]()(lazy(() => env["k"]()(env["True"])))(env["False"])))(env) }, env);
env = Object.assign({ "maybeGetValue": (env => lazy(() => env["Just_Dispatch"]()(env["i"])(env["i"])))(env) }, env);
env = Object.assign({ "maybeBind": (env => lazy(() => env["c"]()(env["c"])(env["Nothing"])))(env) }, env);
env = Object.assign({ "maybeMap": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["b"])(lazy(() => env["b"]()(env["Just"])))))))(env["Nothing"])))(env) }, env);
env = Object.assign({ "maybeAlternative": (env => lazy(() => env["s"]()(env["i"])(env["k"])))(env) }, env);
env = Object.assign({ "maybeTryGetValue": (env => lazy(() => env["c"]()(env["i"])(env["i"])))(env) }, env);
env = Object.assign({ "_listIndexOfPred": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(lazy(() => env["c"]()(env["i"])(env["Nothing"])))))))))(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["if"])))))))(env["Just"])))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(env["c"])))))))(env["Succ"])))))))))(env) }, env);
env = Object.assign({ "listIndexOfPred": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(env["_listIndexOfPred"])))(env["Zero"])))(env) }, env);
env = Object.assign({ "listIndexOf": (env => lazy(() => env["b"]()(env["b"])(env["listIndexOfPred"])))(env) }, env);
env = Object.assign({ "_4": (env => lazy(() => env["Succ"]()(env["three"])))(env) }, env);
env = Object.assign({ "_16": (env => lazy(() => env["mul"]()(env["_4"])(env["_4"])))(env) }, env);
env = Object.assign({ "_32": (env => lazy(() => env["mul"]()(env["two"])(env["_16"])))(env) }, env);
env = Object.assign({ "_48": (env => lazy(() => env["mul"]()(env["three"])(env["_16"])))(env) }, env);
env = Object.assign({ "_10": (env => lazy(() => env["add"]()(env["two"])(lazy(() => env["add"]()(env["_4"])(env["_4"])))))(env) }, env);
env = Object.assign({ "xstrFromNat": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["if"])(env["isZero"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["b"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(lazy(() => env["b"]()(lazy(() => env["add"]()(env["_48"])))(lazy(() => env["c"]()(env["mod"])(env["_10"])))))))))))))))(lazy(() => env["c"]()(env["div"])(env["_10"])))))))))(env) }, env);
env = Object.assign({ "strFromN": (env => lazy(() => env["s"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["if"])(env["isZero"])))(lazy(() => env["ListCons"]()(env["_48"])(env["ListEmpty"])))))(lazy(() => env["xstrFromNat"]()(env["strEmpty"])))))(env) }, env);
env = Object.assign({ "strFromNs": (env => lazy(() => env["listBind"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["strCons"])(env["strFromN"])))(lazy(() => env["ListCons"]()(env["_32"])(env["ListEmpty"])))))))(env) }, env);
env = Object.assign({ "strToN": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["foldl"])(env["Zero"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["add"])(lazy(() => env["c"]()(env["mul"])(env["_10"])))))))(lazy(() => env["c"]()(env["sub"])(env["_48"])))))))(env) }, env);
env = Object.assign({ "strFromB": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["if"])(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))(env) }, env);
env = Object.assign({ "strFromS": (env => lazy(() => env["b"]()(env["strConss"])(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))(lazy(() => env["c"]()(env["ListCons"])(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))(env["ListEmpty"])))))))))(env) }, env);
env = Object.assign({ "strFromPair": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strConss"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["ListCons"])))(lazy(() => env["c"]()(env["b"])(env["fst"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["ListCons"])))(lazy(() => env["c"]()(env["b"])(env["snd"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))))(env) }, env);
env = Object.assign({ "LabeledVertex": (env => lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "LabeledVertex_Dispatch": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "LabeledBinLeaf": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "LabeledBinLeaf_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))(env) }, env);
env = Object.assign({ "LabeledBinVertex": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))))(env) }, env);
env = Object.assign({ "LabeledBinVertex_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))))(env) }, env);
env = Object.assign({ "LabeledOrderedBinLeaf": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "LabeledOrderedBinLeaf_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(env) }, env);
env = Object.assign({ "LabeledOrderedBinVertex": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))))))(env) }, env);
env = Object.assign({ "LabeledOrderedBinVertex_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))))(env) }, env);
env = Object.assign({ "RBTreeLeaf": (env => lazy(() => env["b"]()(env["k"])(env["k"])))(env) }, env);
env = Object.assign({ "RBTreeLeaf_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))))))))(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(env) }, env);
env = Object.assign({ "RBTreeNodeRed": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))))))))(env) }, env);
env = Object.assign({ "RBTreeNodeRed_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))))))(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(env) }, env);
env = Object.assign({ "RBTreeNodeBlack": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))))))))(env) }, env);
env = Object.assign({ "RBTreeNodeBlack_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))))))))(env) }, env);
env = Object.assign({ "nats0": (env => lazy(() => env["unfold"]()(env["Zero"])(env["Succ"])))(env) }, env);
env = Object.assign({ "nats": (env => lazy(() => env["unfold"]()(env["one"])(env["Succ"])))(env) }, env);
env = Object.assign({ "byteVals": (env => lazy(() => env["take"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))))(env["nats0"])))(env) }, env);
env = Object.assign({ "toBinSeq": (env => lazy(() => env["b"]()(lazy(() => env["map"]()(lazy(() => env["c"]()(env["mod"])(env["two"])))))(lazy(() => env["b"]()(lazy(() => env["takeWhile"]()(lazy(() => env["b"]()(env["not"])(env["isZero"])))))(lazy(() => env["c"]()(env["unfold"])(lazy(() => env["c"]()(env["div"])(env["two"])))))))))(env) }, env);
env = Object.assign({ "fromBinSeq": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["foldl"])(lazy(() => env["c"]()(lazy(() => env["zipWith"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["mul"])))(lazy(() => env["pow"]()(env["two"])))))))(env["nats0"])))))(env["Zero"])))(env["add"])))(env) }, env);
env = Object.assign({ "nxor": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["fromBinSeq"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["listZipLonger"])(env["toBinSeq"])))))(env["toBinSeq"])))))(env["Zero"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["mod"])))(env["add"])))))(env["two"])))))))(env) }, env);
env = Object.assign({ "isUpperCaseLetter": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["lAnd"])(lazy(() => env["c"]()(env["isGT"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))))))(lazy(() => env["c"]()(env["isLT"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))))))(env) }, env);
env = Object.assign({ "isLowerCaseLetter": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["lOr"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["lAnd"])(lazy(() => env["c"]()(env["isGT"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))))))(lazy(() => env["c"]()(env["isLT"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))))))))(lazy(() => env["c"]()(env["isEQ"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))))))(env) }, env);
env = Object.assign({ "isAlpha": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["lOr"])(env["isUpperCaseLetter"])))(env["isLowerCaseLetter"])))(env) }, env);
env = Object.assign({ "alpha": (env => lazy(() => env["filter"]()(env["isAlpha"])(env["byteVals"])))(env) }, env);
env = Object.assign({ "isNum": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["lAnd"])(lazy(() => env["c"]()(env["isGT"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(env["two"])))))))))(lazy(() => env["c"]()(env["isLT"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))))))(env) }, env);
env = Object.assign({ "num": (env => lazy(() => env["filter"]()(env["isNum"])(env["byteVals"])))(env) }, env);
env = Object.assign({ "isAlphaNum": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["lOr"])(env["isAlpha"])))(env["isNum"])))(env) }, env);
env = Object.assign({ "isWhiteSpace": (env => lazy(() => env["c"]()(env["isLT"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))))(env) }, env);
env = Object.assign({ "whiteSpace": (env => lazy(() => env["filter"]()(env["isWhiteSpace"])(env["byteVals"])))(env) }, env);
env = Object.assign({ "toUpperCaseLetter": (env => lazy(() => env["s"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["if"])(env["isLowerCaseLetter"])))(lazy(() => env["c"]()(env["add"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))))))(env["i"])))(env) }, env);
env = Object.assign({ "toLowerCaseLetter": (env => lazy(() => env["s"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["if"])(env["isUpperCaseLetter"])))(lazy(() => env["c"]()(env["sub"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))))))(env["i"])))(env) }, env);
env = Object.assign({ "toUpperCaseString": (env => lazy(() => env["map"]()(env["toUpperCaseLetter"])))(env) }, env);
env = Object.assign({ "toLowerCaseString": (env => lazy(() => env["map"]()(env["toLowerCaseLetter"])))(env) }, env);
env = Object.assign({ "halt": (env => lazy(() => env["y"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["if"])))))(env["i"])))))(env["i"])))))(env) }, env);
env = Object.assign({ "fak": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["foldl"])(lazy(() => env["c"]()(env["take"])(env["nats"])))))(env["one"])))(env["mul"])))(env) }, env);
env = Object.assign({ "_nextCandids": (env => lazy(() => env["b"]()(env["filter"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["not"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["isZero"])))(lazy(() => env["c"]()(env["mod"])))))))))(env) }, env);
env = Object.assign({ "_primes": (env => lazy(() => env["y"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(env["ListCons"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["b"])))(lazy(() => env["c"]()(env["_nextCandids"])))))))))(env["head"])))))(env) }, env);
env = Object.assign({ "primes": (env => lazy(() => env["_primes"]()(lazy(() => env["tail"]()(env["nats"])))))(env) }, env);
env = Object.assign({ "fibs": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(env["one"])))(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(env["one"])))(lazy(() => env["s"]()(lazy(() => env["zipWith"]()(env["add"])))(env["tail"])))))))))(env) }, env);
env = Object.assign({ "listCutAt": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["s"]()(env["i"])(lazy(() => env["Pair"]()(env["ListEmpty"])))))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["if"])))))))(lazy(() => env["Pair"]()(env["ListEmpty"])))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["changeFst"])))))(env["c"])))))))))(env["ListCons"])))))))))(env) }, env);
env = Object.assign({ "strFromSS": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["foldl"])(env["strEmpty"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["strCons"])))(lazy(() => env["c"]()(env["strCons"])(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(env["two"])))(env["ListEmpty"])))))))))(env) }, env);
env = Object.assign({ "xlistSplitAt": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["unfold"])(lazy(() => env["c"]()(env["listCutAt"])(lazy(() => env["k"]()(env["True"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["changeSnd"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["listCutAt"])(env["snd"])))))))))(env["tail"])))))(env) }, env);
env = Object.assign({ "listSplitAt": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["listBind"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["snd"])))(env["ListEmpty"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["listCutAt"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["tail"])))(env["xlistSplitAt"])))))))(lazy(() => env["b"]()(env["listIsEmpty"])(env["snd"])))))))(env) }, env);
env = Object.assign({ "listContains": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["any"])))(lazy(() => env["c"]()(env["i"])))))))))(env) }, env);
env = Object.assign({ "strContains": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(env["listContains"])))(env["isEQ"])))(env) }, env);
env = Object.assign({ "listRepeat": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["listBind"]()(env["i"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["take"])))(env["repeat"])))))(env) }, env);
env = Object.assign({ "strBurst": (env => lazy(() => env["map"]()(lazy(() => env["c"]()(env["ListCons"])(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "strTrim": (env => lazy(() => env["b"]()(env["reverse"])(lazy(() => env["b"]()(lazy(() => env["dropWhile"]()(env["isWhiteSpace"])))(lazy(() => env["b"]()(env["reverse"])(lazy(() => env["dropWhile"]()(env["isWhiteSpace"])))))))))(env) }, env);
env = Object.assign({ "strFromMaybe": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(lazy(() => env["b"]()(lazy(() => env["strCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))(env) }, env);
env = Object.assign({ "ParseResultFail": (env => env["k"])(env) }, env);
env = Object.assign({ "ParseResultFail_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))(env) }, env);
env = Object.assign({ "ParseResult": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(env) }, env);
env = Object.assign({ "ParseResult_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(env) }, env);
env = Object.assign({ "parseReturn": (env => lazy(() => env["c"]()(env["ParseResult"])))(env) }, env);
env = Object.assign({ "parseFail": (env => lazy(() => env["k"]()(env["ParseResultFail"])))(env) }, env);
env = Object.assign({ "parseOperation": (env => lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["ParseResultFail"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["ParseResult"])))))))(env) }, env);
env = Object.assign({ "parseBindOperation": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["parseOperation"])))))(env) }, env);
env = Object.assign({ "parsePipe": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["c"])(env["ParseResultFail"])))))))(env["c"])))(env) }, env);
env = Object.assign({ "parseBind": (env => lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["c"])(env["ParseResultFail"])))))))))(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["parseOperation"])))))))))(env) }, env);
env = Object.assign({ "parseBindDiscard": (env => lazy(() => env["parseBind"]()(env["k"])))(env) }, env);
env = Object.assign({ "parseBindOverride": (env => lazy(() => env["parseBind"]()(lazy(() => env["k"]()(env["i"])))))(env) }, env);
env = Object.assign({ "parseBindPair": (env => lazy(() => env["parseBind"]()(env["Pair"])))(env) }, env);
env = Object.assign({ "parseCharIf": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["lAnd"])(lazy(() => env["b"]()(env["not"])(env["listIsEmpty"])))))))(lazy(() => env["c"]()(env["b"])(env["head"])))))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["parseReturn"])(env["head"])))(env["tail"])))))))(env["parseFail"])))(env) }, env);
env = Object.assign({ "parseCharIf": (env => lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["s"]()(env["i"])(env["parseFail"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(env["if"])))))))(env["parseReturn"])))))))))(env["parseFail"])))))(env) }, env);
env = Object.assign({ "parseCharX": (env => lazy(() => env["b"]()(env["parseCharIf"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(env["listContains"])))(env["isEQ"])))))(env) }, env);
env = Object.assign({ "parseChar": (env => lazy(() => env["b"]()(env["parseCharIf"])(env["isEQ"])))(env) }, env);
env = Object.assign({ "parseSingle": (env => lazy(() => env["parseCharIf"]()(lazy(() => env["k"]()(env["True"])))))(env) }, env);
env = Object.assign({ "parseString": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["foldl"])(lazy(() => env["map"]()(env["parseChar"])))))(lazy(() => env["parseReturn"]()(env["strEmpty"])))))(lazy(() => env["parseBind"]()(env["listAddBack"])))))(env) }, env);
env = Object.assign({ "parseUntil": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["parseReturn"])(env["fst"])))(env["snd"])))))(lazy(() => env["c"]()(env["listCutAt"])))))(env) }, env);
env = Object.assign({ "parseWhile": (env => lazy(() => env["b"]()(env["parseUntil"])(lazy(() => env["b"]()(env["not"])))))(env) }, env);
env = Object.assign({ "parseWhileMinOne": (env => lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["if"])(lazy(() => env["b"]()(env["listIsEmpty"])(lazy(() => env["ParseResult_Dispatch"]()(lazy(() => env["k"]()(env["i"])))(env["ListEmpty"])))))))))(env["parseFail"])))))(env["i"])))))(env["parseWhile"])))(env) }, env);
env = Object.assign({ "parseOption": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(env["s"])))))(env["ParseResult"])))(env) }, env);
env = Object.assign({ "parseOptions": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["c"]()(env["i"])(env["ParseResultFail"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["c"]()(env["i"])))))))))(env["c"])))))))))(env["ParseResult"])))))))(env) }, env);
env = Object.assign({ "parseWhitespace": (env => lazy(() => env["parseWhile"]()(env["isWhiteSpace"])))(env) }, env);
env = Object.assign({ "parseWithWhitespace": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["parseBindDiscard"])(lazy(() => env["parseBindOverride"]()(env["parseWhitespace"])))))(env["parseWhitespace"])))(env) }, env);
env = Object.assign({ "parseToken": (env => lazy(() => env["parseBind"]()(env["ListCons"])(lazy(() => env["parseCharIf"]()(env["isAlpha"])))(lazy(() => env["parseWhile"]()(env["isAlphaNum"])))))(env) }, env);
env = Object.assign({ "parsenumber": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseWhileMinOne"]()(env["isNum"])))(env["strToN"])))(env) }, env);
env = Object.assign({ "parseAccept": (env => lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["Nothing"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(env["if"])))))))(env["Just"])))))))(env["Nothing"])))))(env) }, env);
env = Object.assign({ "parseAcceptAll": (env => lazy(() => env["parseAccept"]()(lazy(() => env["k"]()(env["True"])))))(env) }, env);
env = Object.assign({ "parseAcceptFullyConsumed": (env => lazy(() => env["parseAccept"]()(env["listIsEmpty"])))(env) }, env);
env = Object.assign({ "parseWhilesuccessful": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["s"])(lazy(() => env["c"]()(env["ParseResult"])(env["ListEmpty"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["c"])))))(env["ParseResultFail"])))))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["ParseResult"])))))(env["ListCons"])))))))))(env) }, env);
env = Object.assign({ "mapCreate": (env => lazy(() => env["c"]()(env["Pair"])(env["ListEmpty"])))(env) }, env);
env = Object.assign({ "mapGetAll": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["filter"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(env["fst"])))))(env["fst"])))))))(env["snd"])))(env) }, env);
env = Object.assign({ "mapHasKey": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["any"]()(lazy(() => env["k"]()(env["True"])))))))(env["mapGetAll"])))(env) }, env);
env = Object.assign({ "mapCount": (env => lazy(() => env["b"]()(env["length"])(env["snd"])))(env) }, env);
env = Object.assign({ "mapadd": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(env["changeSnd"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["ListCons"])))(env["Pair"])))))(env) }, env);
env = Object.assign({ "mapRemove": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(env["changeSnd"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["filter"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["not"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(env["fst"])))))(env["fst"])))))))))(env) }, env);
env = Object.assign({ "mapSet": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["mapadd"])))(env["mapRemove"])))))(env["i"])))(env) }, env);
env = Object.assign({ "mapGet": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["snd"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["head"])))(env["mapGetAll"])))))(env) }, env);
env = Object.assign({ "idfCreate": (env => env["mapCreate"])(env) }, env);
env = Object.assign({ "idfHandle": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(env["mapHasKey"])))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(env["Pair"])))(env["mapGet"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["Pair"])))))(env["mapadd"])))))))(env["i"])))))(env["mapCount"])))))(env) }, env);
env = Object.assign({ "idfHandleX": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["foldl"])))(lazy(() => env["c"]()(env["Pair"])(env["ListEmpty"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["Pair"])(env["fst"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["listAddBack"])(env["snd"])))))(env["snd"])))))))(lazy(() => env["b"]()(env["idfHandle"])(env["fst"])))))))(env) }, env);
env = Object.assign({ "idfCount": (env => env["mapCount"])(env) }, env);
env = Object.assign({ "listDistinct": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["snd"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["foldl"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["Pair"])(env["idfCreate"])))(env["ListEmpty"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(env["b"])(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["Pair"])(env["fst"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["isEQ"])(env["snd"])))))(env["idfCount"])))))))))))(lazy(() => env["c"]()(env["listAddBack"])))))))))))(env["i"])))))))))(lazy(() => env["b"]()(env["idfHandle"])(env["fst"])))))))))(env) }, env);
env = Object.assign({ "newLine": (env => lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(env["two"])))(env["ListEmpty"])))(env) }, env);
env = Object.assign({ "empty": (env => lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))(env) }, env);
env = Object.assign({ "gDrawL": (env => lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["listBind"])))(lazy(() => env["c"]()(env["c"])))))))))(lazy(() => env["c"]()(env["take"])(env["nats0"])))))(env) }, env);
env = Object.assign({ "gDraw": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["listBind"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["listConcat"])))))(lazy(() => env["b"]()(env["c"])(env["gDrawL"])))))))))(env["newLine"])))))))))(lazy(() => env["c"]()(env["take"])(env["nats0"])))))(env) }, env);
env = Object.assign({ "gCanvas": (env => lazy(() => env["k"]()(lazy(() => env["k"]()(env["empty"])))))(env) }, env);
env = Object.assign({ "gOverlay": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))))))))))(lazy(() => env["c"]()(env["ListCons"])(env["ListEmpty"])))))))))(env) }, env);
env = Object.assign({ "gPixel": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["gOverlay"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["lAnd"])))(lazy(() => env["c"]()(env["isEQ"])))))))))))(lazy(() => env["c"]()(env["isEQ"])))))))(env) }, env);
env = Object.assign({ "gCircle": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["gOverlay"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["isGT"])(lazy(() => env["c"]()(env["pow"])(env["two"])))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["add"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["pow"])))(lazy(() => env["c"]()(env["diff"])))))))(env["two"])))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["pow"])))(lazy(() => env["c"]()(env["diff"])))))))(env["two"])))))))))(env) }, env);
env = Object.assign({ "beanEmpty": (env => lazy(() => env["k"]()(env["Nothing"])))(env) }, env);
env = Object.assign({ "beanSet": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(env["strEquals"])))))))(env["Just"])))))))))(env) }, env);
env = Object.assign({ "beanTryGet": (env => env["i"])(env) }, env);
env = Object.assign({ "beanGet": (env => lazy(() => env["b"]()(env["maybeGetValue"])))(env) }, env);
env = Object.assign({ "beanHas": (env => lazy(() => env["b"]()(env["maybeHasValue"])))(env) }, env);
env = Object.assign({ "seqEmpty": (env => lazy(() => env["Pair"]()(env["Zero"])(env["i"])))(env) }, env);
env = Object.assign({ "seqLength": (env => env["fst"])(env) }, env);
env = Object.assign({ "seqGet": (env => env["snd"])(env) }, env);
env = Object.assign({ "seqSet": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(env["changeSnd"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(env["isEQ"])))))))))(env) }, env);
env = Object.assign({ "seqaddFront": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["Pair"])(lazy(() => env["b"]()(env["Succ"])(env["seqLength"])))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["if"])(env["isZero"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["seqGet"])))(env["pred"])))))))(env) }, env);
env = Object.assign({ "seqaddBack": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["Pair"])(lazy(() => env["b"]()(env["Succ"])(env["seqLength"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["b"]()(lazy(() => env["c"]()(env["isEQ"])))(env["seqLength"])))))))))))(env["seqGet"])))))(env) }, env);
env = Object.assign({ "seqConcat": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["Pair"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["add"])(env["seqLength"])))))(env["seqLength"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["s"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["b"]()(lazy(() => env["c"]()(env["isLT"])))(env["seqLength"])))))))(env["seqGet"])))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["seqGet"])))))(lazy(() => env["b"]()(lazy(() => env["c"]()(env["sub"])))(env["seqLength"])))))))))(env) }, env);
env = Object.assign({ "seqRangeUnsafe": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(env["Pair"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(env["seqGet"])))))(lazy(() => env["c"]()(env["sub"])))))))(env) }, env);
env = Object.assign({ "seqRange": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(env["seqRangeUnsafe"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(env["min"])))))(lazy(() => env["b"]()(env["sub"])(env["seqLength"])))))))(env) }, env);
env = Object.assign({ "seqToList": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["map"])(env["seqGet"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["take"])(env["seqLength"])))(env["nats0"])))))(env) }, env);
env = Object.assign({ "listToSeq": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["foldr"])(env["seqEmpty"])))(env["seqaddFront"])))(env) }, env);
env = Object.assign({ "_switchCond": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(env["foldr"])))))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["c"]()(env["b"])(env["fst"])))))))(env["snd"])))))))(env) }, env);
env = Object.assign({ "switchCond": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(env["_switchCond"])))))(env) }, env);
env = Object.assign({ "switch": (env => lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["switchCond"])))(lazy(() => env["c"]()(env["i"])))))))(env) }, env);
env = Object.assign({ "switchN": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(env["switch"])))(env["isEQ"])))(env) }, env);
env = Object.assign({ "getFirstConsumeMoreDeferred": (env => lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["y"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["if"])(env["isZero"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["b"])(env["pred"])))))))))))))(env) }, env);
env = Object.assign({ "getFirstConsumeMore": (env => lazy(() => env["b"]()(env["getFirstConsumeMoreDeferred"])(env["k"])))(env) }, env);
env = Object.assign({ "_eCharBrOpen": (env => lazy(() => env["head"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "_eCharBrClose": (env => lazy(() => env["head"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "_eCharSqBrOpen": (env => lazy(() => env["head"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "_eCharSqBrClose": (env => lazy(() => env["head"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "_eCharComma": (env => lazy(() => env["head"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["two"])))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "_eCharAbstr": (env => lazy(() => env["head"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "_eCharOr": (env => lazy(() => env["head"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "_eCharAnd": (env => lazy(() => env["head"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["one"])(env["two"])))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "_eCharDollar": (env => lazy(() => env["head"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["two"])))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "_eCharAssign": (env => lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env) }, env);
env = Object.assign({ "_eCharComment": (env => lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["two"])))))(env) }, env);
env = Object.assign({ "_eStrColon": (env => lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(env["ListEmpty"])))(env) }, env);
env = Object.assign({ "_eIsQuot": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["lOr"])(lazy(() => env["c"]()(env["isEQ"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))))))(lazy(() => env["c"]()(env["isEQ"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))))))(env) }, env);
env = Object.assign({ "_eIsNewLine": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["lOr"])(lazy(() => env["c"]()(env["isEQ"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))))(lazy(() => env["c"]()(env["isEQ"])(lazy(() => env["_qadd"]()(env["one"])(env["three"])))))))(env) }, env);
env = Object.assign({ "ScharParenOpen": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))))))))))(env) }, env);
env = Object.assign({ "ScharParenOpen_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))(env) }, env);
env = Object.assign({ "ScharParenClose": (env => lazy(() => env["k"]()(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))))))))))(env) }, env);
env = Object.assign({ "ScharParenClose_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))(env) }, env);
env = Object.assign({ "ScharAbstraction": (env => lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))))))))))(env) }, env);
env = Object.assign({ "ScharAbstraction_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env["i"])))))))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))(env) }, env);
env = Object.assign({ "ScharAssign": (env => lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))))))))))(env) }, env);
env = Object.assign({ "ScharAssign_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env["i"])))))(env["i"])))))))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))(env) }, env);
env = Object.assign({ "ScharSqBracketOpen": (env => lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))))))))))(env) }, env);
env = Object.assign({ "ScharSqBracketOpen_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))))))))(env["i"])))))))(env["i"])))))))(env["i"])))))))(env["i"])))(env) }, env);
env = Object.assign({ "ScharSqBracketClose": (env => lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(env["k"])))))))))))))))(env) }, env);
env = Object.assign({ "ScharSqBracketClose_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))))))))(env["i"])))))))(env["i"])))))))(env["i"])))(env) }, env);
env = Object.assign({ "ScharComma": (env => lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["b"]()(env["k"])(env["k"])))))))))))))))(env) }, env);
env = Object.assign({ "ScharComma_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))))))))(env["i"])))))))(env["i"])))(env) }, env);
env = Object.assign({ "ScharSingleOr": (env => lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(env["k"])))))))))))))))(env) }, env);
env = Object.assign({ "ScharSingleOr_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))))))))(env["i"])))(env) }, env);
env = Object.assign({ "ScharDollar": (env => lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["k"]()(env["i"])))))))))))))))))(env) }, env);
env = Object.assign({ "ScharDollar_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))(env["i"])))))))(env) }, env);
env = Object.assign({ "scharID": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["Zero"])))(env["one"])))(env["two"])))(env["three"])))(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env) }, env);
env = Object.assign({ "scharEQ": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["isEQ"])(env["scharID"])))))(env["scharID"])))(env) }, env);
env = Object.assign({ "schar_String": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))))))))))))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))))))))))))))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))))))))))))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))))))))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))))))))))))))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))))))))))))))))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))))))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))))))))))))))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))))))))))))))))(env) }, env);
env = Object.assign({ "TokenSpecialChar": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))))))))))(env) }, env);
env = Object.assign({ "TokenSpecialChar_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(env["k"])))))))(env["k"])))))))(env["k"])))))))(env["k"])))))))(env["k"])))(env) }, env);
env = Object.assign({ "TokenLiteralLower": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))))))))))(env) }, env);
env = Object.assign({ "TokenLiteralLower_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))))))))(env["k"])))))))(env["k"])))))))(env["k"])))))))(env["k"])))(env) }, env);
env = Object.assign({ "TokenLiteralUpper": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))))))))))(env) }, env);
env = Object.assign({ "TokenLiteralUpper_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))(env["k"])))))))))))(env["k"])))))))(env["k"])))))))(env["k"])))(env) }, env);
env = Object.assign({ "TokenConstS": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))))))))))(env) }, env);
env = Object.assign({ "TokenConstS_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))(env["k"])))))(env["k"])))))))))))(env["k"])))))))(env["k"])))(env) }, env);
env = Object.assign({ "TokenConstN": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))))))))))(env) }, env);
env = Object.assign({ "TokenConstN_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))(env["k"])))))(env["k"])))))(env["k"])))))))))))(env["k"])))(env) }, env);
env = Object.assign({ "TokenComment": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["c"]()(env["i"])))))))))))))(env) }, env);
env = Object.assign({ "TokenComment_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))(env["k"])))))(env["k"])))))(env["k"])))))(env["k"])))))))(env) }, env);
env = Object.assign({ "tokenLiteral": (env => lazy(() => env["s"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["if"])(lazy(() => env["b"]()(env["isLowerCaseLetter"])(env["head"])))))(env["TokenLiteralLower"])))(env["TokenLiteralUpper"])))(env) }, env);
env = Object.assign({ "token_String": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["schar_String"])))(lazy(() => env["b"]()(env["strConss"])(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))))))(lazy(() => env["c"]()(env["ListCons"])(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))(env["ListEmpty"])))))))))))(lazy(() => env["b"]()(env["strConss"])(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))))))(lazy(() => env["c"]()(env["ListCons"])(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))(env["ListEmpty"])))))))))))(lazy(() => env["b"]()(env["strConss"])(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))(lazy(() => env["c"]()(env["ListCons"])(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))(env["ListEmpty"])))))))))))(lazy(() => env["b"]()(env["strConss"])(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["strFromN"])))(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))(env["ListEmpty"])))))))))))(lazy(() => env["k"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["three"])))))(env["ListEmpty"])))))))))))))))))))))))(env) }, env);
env = Object.assign({ "token_String_list": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["strJoin"])(lazy(() => env["map"]()(env["token_String"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "eatParenOpen": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseChar"]()(env["_eCharBrOpen"])))(lazy(() => env["k"]()(lazy(() => env["TokenSpecialChar"]()(env["ScharParenOpen"])))))))(env) }, env);
env = Object.assign({ "eatParenClose": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseChar"]()(env["_eCharBrClose"])))(lazy(() => env["k"]()(lazy(() => env["TokenSpecialChar"]()(env["ScharParenClose"])))))))(env) }, env);
env = Object.assign({ "eatSqBracketOpen": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseChar"]()(env["_eCharSqBrOpen"])))(lazy(() => env["k"]()(lazy(() => env["TokenSpecialChar"]()(env["ScharSqBracketOpen"])))))))(env) }, env);
env = Object.assign({ "eatSqBracketClose": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseChar"]()(env["_eCharSqBrClose"])))(lazy(() => env["k"]()(lazy(() => env["TokenSpecialChar"]()(env["ScharSqBracketClose"])))))))(env) }, env);
env = Object.assign({ "eatComma": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseChar"]()(env["_eCharComma"])))(lazy(() => env["k"]()(lazy(() => env["TokenSpecialChar"]()(env["ScharComma"])))))))(env) }, env);
env = Object.assign({ "eatAbstraction": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseChar"]()(env["_eCharAbstr"])))(lazy(() => env["k"]()(lazy(() => env["TokenSpecialChar"]()(env["ScharAbstraction"])))))))(env) }, env);
env = Object.assign({ "eatAssign": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseChar"]()(env["_eCharAssign"])))(lazy(() => env["k"]()(lazy(() => env["TokenSpecialChar"]()(env["ScharAssign"])))))))(env) }, env);
env = Object.assign({ "eatSingleOr": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseChar"]()(env["_eCharOr"])))(lazy(() => env["k"]()(lazy(() => env["TokenSpecialChar"]()(env["ScharSingleOr"])))))))(env) }, env);
env = Object.assign({ "eatDollar": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseChar"]()(env["_eCharDollar"])))(lazy(() => env["k"]()(lazy(() => env["TokenSpecialChar"]()(env["ScharDollar"])))))))(env) }, env);
env = Object.assign({ "eatLiteral": (env => lazy(() => env["parseBindOperation"]()(env["parseToken"])(env["tokenLiteral"])))(env) }, env);
env = Object.assign({ "eatConstS": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseBindOverride"]()(lazy(() => env["parseCharIf"]()(env["_eIsQuot"])))(lazy(() => env["parseBindDiscard"]()(lazy(() => env["parseUntil"]()(env["_eIsQuot"])))(lazy(() => env["parseCharIf"]()(env["_eIsQuot"])))))))(env["TokenConstS"])))(env) }, env);
env = Object.assign({ "eatConstN": (env => lazy(() => env["parseBindOperation"]()(env["parsenumber"])(env["TokenConstN"])))(env) }, env);
env = Object.assign({ "eatComment": (env => lazy(() => env["parseBindOperation"]()(lazy(() => env["parseBindOverride"]()(lazy(() => env["parseChar"]()(env["_eCharComment"])))(lazy(() => env["parseUntil"]()(env["_eIsNewLine"])))))(env["TokenComment"])))(env) }, env);
env = Object.assign({ "eatSpecialChar": (env => lazy(() => env["parseOptions"]()(lazy(() => env["ListCons"]()(env["eatParenOpen"])(lazy(() => env["ListCons"]()(env["eatParenClose"])(lazy(() => env["ListCons"]()(env["eatAbstraction"])(lazy(() => env["ListCons"]()(env["eatAssign"])(lazy(() => env["ListCons"]()(env["eatSqBracketOpen"])(lazy(() => env["ListCons"]()(env["eatSqBracketClose"])(lazy(() => env["ListCons"]()(env["eatComma"])(lazy(() => env["ListCons"]()(env["eatSingleOr"])(lazy(() => env["ListCons"]()(env["eatDollar"])(env["ListEmpty"])))))))))))))))))))))(env) }, env);
env = Object.assign({ "eatSomething": (env => lazy(() => env["parseWithWhitespace"]()(lazy(() => env["parseOptions"]()(lazy(() => env["ListCons"]()(env["eatSpecialChar"])(lazy(() => env["ListCons"]()(env["eatLiteral"])(lazy(() => env["ListCons"]()(env["eatConstS"])(lazy(() => env["ListCons"]()(env["eatConstN"])(lazy(() => env["ListCons"]()(env["eatComment"])(env["ListEmpty"])))))))))))))))(env) }, env);
env = Object.assign({ "token_Process": (env => lazy(() => env["b"]()(env["parseAcceptFullyConsumed"])(lazy(() => env["parseWhilesuccessful"]()(env["eatSomething"])))))(env) }, env);
env = Object.assign({ "token_Run": (env => lazy(() => env["b"]()(lazy(() => env["strFromMaybe"]()(env["i"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeMap"])(env["token_Process"])))(env["token_String_list"])))))(env) }, env);
env = Object.assign({ "SyntaxName": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))))))))))))))(env) }, env);
env = Object.assign({ "SyntaxName_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(env["k"])))))))(env["k"])))))))(env["k"])))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))(env) }, env);
env = Object.assign({ "SyntaxConstN": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))))))))))))))(env) }, env);
env = Object.assign({ "SyntaxConstN_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))))))))(env["k"])))))))(env["k"])))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))(env) }, env);
env = Object.assign({ "SyntaxConstS": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))))))))))))))(env) }, env);
env = Object.assign({ "SyntaxConstS_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))(env["k"])))))))))))(env["k"])))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))(env) }, env);
env = Object.assign({ "SyntaxList": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))))))))))))))(env) }, env);
env = Object.assign({ "SyntaxList_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))(env["k"])))))(env["k"])))))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))(env) }, env);
env = Object.assign({ "SyntaxAbstraction": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))))))))))))))(env) }, env);
env = Object.assign({ "SyntaxAbstraction_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))(env["k"])))))(env["k"])))))(env["k"])))))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))(env) }, env);
env = Object.assign({ "SyntaxApplication": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))))))))))))))(env) }, env);
env = Object.assign({ "SyntaxApplication_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))(env["k"])))))(env["k"])))))(env["k"])))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))(env) }, env);
env = Object.assign({ "SyntaxAssignment": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))))))))))))))(env) }, env);
env = Object.assign({ "SyntaxAssignment_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))(env["k"])))))(env["k"])))))(env["k"])))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))(env) }, env);
env = Object.assign({ "SyntaxType": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))))))))))))))(env) }, env);
env = Object.assign({ "SyntaxType_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))(env["k"])))))(env["k"])))))(env["k"])))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))))))(env) }, env);
env = Object.assign({ "syntaxCreateApplication": (env => lazy(() => env["c"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["foldl"])(env["tail"])))(env["head"])))(env["SyntaxApplication"])))(env) }, env);
env = Object.assign({ "syntaxCreateAbstraction": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(env["foldr"])))(lazy(() => env["c"]()(env["SyntaxAbstraction"])))))(env) }, env);
env = Object.assign({ "syntax_String": (env => lazy(() => env["y"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(lazy(() => env["b"]()(env["strConss"])(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))(lazy(() => env["c"]()(env["ListCons"])(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))(lazy(() => env["b"]()(env["strConss"])(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["strFromN"])))(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))(lazy(() => env["b"]()(env["strConss"])(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))(lazy(() => env["c"]()(env["ListCons"])(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strConss"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["ListCons"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strJoin"])))(env["map"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strConss"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["ListCons"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["ListCons"])))))(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strConss"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(env["ListCons"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["ListCons"])))))(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strConss"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["ListCons"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["ListCons"])))))(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strConss"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["ListCons"])))(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["strJoin"])(lazy(() => env["map"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["strCons"])(env["fst"])))(lazy(() => env["b"]()(env["strConss"])(lazy(() => env["b"]()(lazy(() => env["map"]()(lazy(() => env["strCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))(env["snd"])))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))))))))(env) }, env);
env = Object.assign({ "syntax_String_list": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["strJoin"])(lazy(() => env["map"]()(env["syntax_String"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))(env) }, env);
env = Object.assign({ "cstrParseAbstractionTail": (env => lazy(() => env["b"]()(lazy(() => env["parsePipe"]()(env["parseSingle"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["TokenLiteralLower_Dispatch"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["parseBindOperation"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["ListCons"])))(env["SyntaxAbstraction"])))))(env["ListEmpty"])))))))(env["parseFail"])))))(env) }, env);
env = Object.assign({ "cstrParseSChar": (env => lazy(() => env["b"]()(lazy(() => env["parsePipe"]()(env["parseSingle"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["TokenSpecialChar_Dispatch"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(env["scharEQ"])))))(lazy(() => env["parseReturn"]()(env["i"])))))))(env["parseFail"])))))(env["parseFail"])))))(env) }, env);
env = Object.assign({ "cstrParseLiteralL": (env => lazy(() => env["parsePipe"]()(env["parseSingle"])(lazy(() => env["TokenLiteralLower_Dispatch"]()(env["parseReturn"])(env["parseFail"])))))(env) }, env);
env = Object.assign({ "cstrParseLiteralU": (env => lazy(() => env["parsePipe"]()(env["parseSingle"])(lazy(() => env["TokenLiteralUpper_Dispatch"]()(env["parseReturn"])(env["parseFail"])))))(env) }, env);
env = Object.assign({ "cstrParseCloseParen": (env => lazy(() => env["cstrParseSChar"]()(env["ScharParenClose"])))(env) }, env);
env = Object.assign({ "cstrParseCloseSqBr": (env => lazy(() => env["cstrParseSChar"]()(env["ScharSqBracketClose"])))(env) }, env);
env = Object.assign({ "cstrParseComma": (env => lazy(() => env["cstrParseSChar"]()(env["ScharComma"])))(env) }, env);
env = Object.assign({ "cstrParseAssign": (env => lazy(() => env["cstrParseSChar"]()(env["ScharAssign"])))(env) }, env);
env = Object.assign({ "cstrParseSingleOr": (env => lazy(() => env["cstrParseSChar"]()(env["ScharSingleOr"])))(env) }, env);
env = Object.assign({ "cstrParseDollar": (env => lazy(() => env["cstrParseSChar"]()(env["ScharDollar"])))(env) }, env);
env = Object.assign({ "cstrParseListTail": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["parseBindDiscard"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["parseBindOperation"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["parseOption"])(lazy(() => env["s"]()(lazy(() => env["parseBind"]()(env["ListCons"])))(lazy(() => env["b"]()(env["parseWhilesuccessful"])(lazy(() => env["parseBindOverride"]()(env["cstrParseComma"])))))))))(lazy(() => env["parseReturn"]()(env["ListEmpty"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["SyntaxList"])))(env["ListEmpty"])))))))(env["cstrParseCloseSqBr"])))(env) }, env);
env = Object.assign({ "cstrParseAssignTail": (env => lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["parseBindOperation"])(lazy(() => env["parseBindOverride"]()(env["cstrParseAssign"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["ListCons"])))(env["SyntaxAssignment"])))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "cstrParseDataDefOption": (env => lazy(() => env["parseBind"]()(env["Pair"])(env["cstrParseLiteralU"])(lazy(() => env["parseWhilesuccessful"]()(env["cstrParseLiteralL"])))))(env) }, env);
env = Object.assign({ "cstrParseDataDefTail2": (env => lazy(() => env["parseBind"]()(env["ListCons"])(env["cstrParseDataDefOption"])(lazy(() => env["parseWhilesuccessful"]()(lazy(() => env["parseBindOverride"]()(env["cstrParseSingleOr"])(env["cstrParseDataDefOption"])))))))(env) }, env);
env = Object.assign({ "cstrParseDataDefTail": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["b"]()(lazy(() => env["parseBindOperation"]()(lazy(() => env["parseBindOverride"]()(env["cstrParseAssign"])(env["cstrParseDataDefTail2"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["ListCons"])))(env["SyntaxType"])))))(env["ListEmpty"])))))))(env) }, env);
env = Object.assign({ "cstrSyntaxSingle": (env => lazy(() => env["b"]()(lazy(() => env["parsePipe"]()(env["parseSingle"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["parseBindDiscard"])(lazy(() => env["c"]()(env["parseBindOperation"])(env["listReturn"])))))(env["cstrParseCloseParen"])))))))(env["parseFail"])))))(env["cstrParseAbstractionTail"])))))(env["parseFail"])))))(env["cstrParseListTail"])))))(env["parseFail"])))))(env["parseFail"])))))(env["parseFail"])))))(env["parseFail"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["parseOption"])))(lazy(() => env["c"]()(env["cstrParseAssignTail"])))))))(lazy(() => env["b"]()(env["parseReturn"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["SyntaxName"])))(env["ListEmpty"])))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["parseOption"])))(lazy(() => env["c"]()(env["cstrParseDataDefTail"])))))))(lazy(() => env["b"]()(env["parseReturn"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["SyntaxName"])))(env["ListEmpty"])))))))))))(lazy(() => env["b"]()(env["parseReturn"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["SyntaxConstS"])))(env["ListEmpty"])))))))))(lazy(() => env["b"]()(env["parseReturn"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["SyntaxConstN"])))(env["ListEmpty"])))))))))(lazy(() => env["k"]()(env["parseReturn"])(env["ListEmpty"])))))))(env) }, env);
env = Object.assign({ "cstrSyntaxApplication": (env => lazy(() => env["s"]()(lazy(() => env["b"]()(env["parsePipe"])(lazy(() => env["b"]()(env["parseWhilesuccessful"])(env["cstrSyntaxSingle"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["if"])(env["listIsEmpty"])))(env["parseFail"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["parseBindOperation"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["parseOption"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["parseBindOperation"])(lazy(() => env["parseBindOverride"]()(env["cstrParseDollar"])))))(env["listReturn"])))))(lazy(() => env["parseReturn"]()(env["ListEmpty"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(env["listConcat"])))(env["u"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["foldl"])))))(env["SyntaxApplication"])))))))))))(lazy(() => env["listBind"]()(env["i"])))))))(env) }, env);
env = Object.assign({ "cstrSyntaxEverything": (env => lazy(() => env["parseWhilesuccessful"]()(lazy(() => env["y"]()(env["cstrSyntaxApplication"])))))(env) }, env);
env = Object.assign({ "syntax_Process": (env => lazy(() => env["b"]()(env["parseAcceptFullyConsumed"])(env["cstrSyntaxEverything"])))(env) }, env);
env = Object.assign({ "syntax_Run": (env => lazy(() => env["b"]()(lazy(() => env["strFromMaybe"]()(env["i"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeMap"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeBind"])(env["token_Process"])))(env["syntax_Process"])))))(env["syntax_String_list"])))))(env) }, env);
env = Object.assign({ "NativeAssignment": (env => lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "NativeAssignment_Dispatch": (env => lazy(() => env["b"]()(env["k"])(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "NativeLiteral": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["i"])))))(env) }, env);
env = Object.assign({ "NativeLiteral_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(lazy(() => env["b"]()(env["k"])(env["k"])))))(env) }, env);
env = Object.assign({ "NativeApplication": (env => lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(env["i"])))))))(env) }, env);
env = Object.assign({ "NativeApplication_Dispatch": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(env["k"])))))))(env) }, env);
env = Object.assign({ "getCollisionFreeLiteral": (env => lazy(() => env["strCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(env["ListEmpty"])))))))))))))(env) }, env);
env = Object.assign({ "nativeExpr_String": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(lazy(() => env["b"]()(env["strConss"])(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))(lazy(() => env["c"]()(env["ListCons"])(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strConss"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(env["ListCons"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["ListCons"])))))(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))))))))(env) }, env);
env = Object.assign({ "nativeDef_String": (env => lazy(() => env["c"]()(env["i"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strConss"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["ListCons"])))(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["nativeExpr_String"])))(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))))))(env) }, env);
env = Object.assign({ "nativeDef_String_list": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["strJoin"])(lazy(() => env["map"]()(env["nativeExpr_String"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))(env) }, env);
env = Object.assign({ "nativeExpr_String_list": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["strJoin"])(lazy(() => env["map"]()(env["nativeDef_String"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))(env) }, env);
env = Object.assign({ "nativeI": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))(env) }, env);
env = Object.assign({ "nativeK": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))(env) }, env);
env = Object.assign({ "nativeB": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))(env) }, env);
env = Object.assign({ "nativeC": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))(env) }, env);
env = Object.assign({ "nativeS": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))(env) }, env);
env = Object.assign({ "nativeY": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))(env) }, env);
env = Object.assign({ "nativeListEmpty": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))))(env) }, env);
env = Object.assign({ "nativeListCons": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))(env) }, env);
env = Object.assign({ "nativeStrToN": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(env["ListEmpty"])))))))))))))))(env) }, env);
env = Object.assign({ "native0": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))(env) }, env);
env = Object.assign({ "native1": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))(env) }, env);
env = Object.assign({ "native2": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))(env) }, env);
env = Object.assign({ "native3": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))(env) }, env);
env = Object.assign({ "nativeSucc": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))(env) }, env);
env = Object.assign({ "nativeMul": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))(env) }, env);
env = Object.assign({ "nativeQadd": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))(env) }, env);
env = Object.assign({ "isNativeLiteral": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["NativeLiteral_Dispatch"])(env["strEquals"])))(env["False"])))(env) }, env);
env = Object.assign({ "nativeContainsLit": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(env["b"])(env["strEquals"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["lOr"])))))(env["c"])))))))))(env["c"])))))))(env) }, env);
env = Object.assign({ "finalizeLiteral": (env => lazy(() => env["s"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["if"])(lazy(() => env["c"]()(env["strStartsWith"])(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(env["ListEmpty"])))))))))))))))))))(lazy(() => env["drop"]()(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(env["i"])))(env) }, env);
env = Object.assign({ "finalizeNativeExpr": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(lazy(() => env["b"]()(env["NativeLiteral"])(env["finalizeLiteral"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["if"])(lazy(() => env["isNativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(env["ListEmpty"])))))))))))(lazy(() => env["c"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["NativeApplication_Dispatch"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["if"])(lazy(() => env["isNativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))(env["i"])))))))))))(env["i"])))))(env["NativeApplication"])))))))))(env["i"])))))))(env) }, env);
env = Object.assign({ "finalizeNativeDefs": (env => lazy(() => env["c"]()(env["i"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["NativeAssignment"])))(env["finalizeNativeExpr"])))))(env) }, env);
env = Object.assign({ "_03ToNative": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["native0"])))(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["native1"])))(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["native2"])))(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["native3"])))(lazy(() => env["k"]()(env["native0"])))))))))))(env) }, env);
env = Object.assign({ "_nToNative": (env => lazy(() => env["y"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(env["if"])(env["isZero"])))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["NativeApplication"])(lazy(() => env["NativeApplication"]()(env["nativeQadd"])))))))))))))(lazy(() => env["c"]()(env["div"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))))(lazy(() => env["b"]()(env["_03ToNative"])(lazy(() => env["c"]()(env["mod"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))))))(env) }, env);
env = Object.assign({ "_sToNative": (env => lazy(() => env["c"]()(lazy(() => env["c"]()(env["foldr"])(env["nativeListEmpty"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["NativeApplication"])(lazy(() => env["b"]()(lazy(() => env["NativeApplication"]()(env["nativeListCons"])))(env["_nToNative"])))))))))(env) }, env);
env = Object.assign({ "_syntaxToNative": (env => lazy(() => env["y"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["NativeLiteral"])))(env["_nToNative"])))(env["_sToNative"])))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["foldr"])(env["nativeListEmpty"])))))(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["NativeApplication"])))(lazy(() => env["b"]()(lazy(() => env["NativeApplication"]()(env["nativeListCons"])))))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["y"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["NativeApplication_Dispatch"])))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))))(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["c"]()(env["nativeContainsLit"])))))))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))))(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["c"]()(env["nativeContainsLit"])))))))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["NativeApplication"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["NativeApplication"]()(env["nativeS"])))))))))))))))(env["i"])))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["NativeApplication"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["NativeApplication"]()(env["nativeC"])))))))))))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["c"]()(env["nativeContainsLit"])))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["if"])(lazy(() => env["NativeLiteral_Dispatch"]()(lazy(() => env["k"]()(env["True"])))(env["False"])))))))))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["NativeApplication"])(lazy(() => env["NativeApplication"]()(env["nativeB"])))))))))))))))))))))))(lazy(() => env["NativeApplication"]()(env["nativeK"])))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["c"]()(env["nativeContainsLit"])))))))(env["nativeI"])))))(lazy(() => env["NativeApplication"]()(env["nativeK"])))))))))))(env["i"])))))))))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(env["NativeApplication"])))))))(env["i"])))))))(lazy(() => env["k"]()(lazy(() => env["k"]()(lazy(() => env["NativeAssignment"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))(lazy(() => env["_sToNative"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))))(lazy(() => env["k"]()(lazy(() => env["NativeAssignment"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))(lazy(() => env["_sToNative"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))(env) }, env);
env = Object.assign({ "_createUniqueNameFromN": (env => lazy(() => env["b"]()(lazy(() => env["strCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(env["ListEmpty"])))))))))))))))))(env["strFromN"])))(env) }, env);
env = Object.assign({ "_createUniqueNameFromS": (env => lazy(() => env["strCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(env["ListEmpty"])))))))))))))))))(env) }, env);
env = Object.assign({ "_syntaxEmitTypeInstance": (env => lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["ListCons"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(env["NativeAssignment"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["_syntaxToNative"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["syntaxCreateAbstraction"])))(lazy(() => env["c"]()(env["listConcat"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["syntaxCreateApplication"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["map"]()(env["SyntaxName"])))))(lazy(() => env["b"]()(env["ListCons"])(env["_createUniqueNameFromN"])))))))))))))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["ListCons"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["NativeAssignment"])(lazy(() => env["c"]()(env["strCons"])(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["_syntaxToNative"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["syntaxCreateAbstraction"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["b"])(env["ListCons"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["ListCons"])))(lazy(() => env["c"]()(env["ListCons"])(env["ListEmpty"])))))))))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["syntaxCreateApplication"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["SyntaxName"])))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["map"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["if"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["isEQ"])))(env["snd"])))))))))(env["SyntaxName"])))))))))(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["syntaxCreateAbstraction"])(lazy(() => env["b"]()(env["snd"])(env["fst"])))))))(env["SyntaxName"])))))))))))))))))))))(lazy(() => env["_createUniqueNameFromS"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(env["ListEmpty"])))))))))))))))(lazy(() => env["_createUniqueNameFromS"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(env["ListEmpty"])))))))))))))(lazy(() => env["_createUniqueNameFromS"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "_syntaxEmitTypeStuff": (env => lazy(() => env["k"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["listBind"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["s"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(env["_syntaxEmitTypeInstance"])))))))(env["snd"])))))))))(env["fst"])))))))(env["fst"])))))))(env["snd"])))))))(env["i"])))))(env) }, env);
env = Object.assign({ "_make__ValueDef": (env => lazy(() => env["SyntaxAssignment"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))(env) }, env);
env = Object.assign({ "_syntaxToNativeDefs": (env => lazy(() => env["y"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["s"]()(env["i"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["b"])(env["_make__ValueDef"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["b"])(env["_make__ValueDef"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["b"])(env["_make__ValueDef"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["b"])(env["_make__ValueDef"])))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["b"])(env["_make__ValueDef"])))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["k"])))(lazy(() => env["c"]()(env["b"])(env["_make__ValueDef"])))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["listReturn"])))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["b"])(env["NativeAssignment"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["NativeApplication"]()(env["nativeY"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["_syntaxToNative"])))(env["SyntaxAbstraction"])))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["c"])(env["_syntaxEmitTypeStuff"])))))(lazy(() => env["b"]()(lazy(() => env["map"]()(env["_createUniqueNameFromN"])))(lazy(() => env["c"]()(env["take"])(env["nats0"])))))))))(env["length"])))))(lazy(() => env["c"]()(env["zip"])(env["nats0"])))))))))(env) }, env);
env = Object.assign({ "syntaxToNative": (env => lazy(() => env["b"]()(lazy(() => env["map"]()(env["finalizeNativeDefs"])))(env["_syntaxToNativeDefs"])))(env) }, env);
env = Object.assign({ "_nlB": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "_nlMB": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))))(env) }, env);
env = Object.assign({ "_nlTA": (env => lazy(() => env["NativeLiteral"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))))(env) }, env);
env = Object.assign({ "nativeToTypeNative": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(lazy(() => env["b"]()(env["NativeLiteral"])(lazy(() => env["c"]()(env["strCons"])(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["NativeApplication"])))(lazy(() => env["b"]()(lazy(() => env["NativeApplication"]()(env["_nlMB"])))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["NativeApplication"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["NativeApplication"]()(env["_nlB"])))))(lazy(() => env["b"]()(lazy(() => env["NativeApplication"]()(env["_nlMB"])))))))))))(env["_nlTA"])))))))))(env) }, env);
env = Object.assign({ "nativeDefToTypeNative": (env => lazy(() => env["c"]()(env["i"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(lazy(() => env["b"]()(env["NativeAssignment"])(lazy(() => env["c"]()(env["strCons"])(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["two"])(env["one"])))))))(env["ListEmpty"])))))))))))))))))(env["nativeToTypeNative"])))))(env) }, env);
env = Object.assign({ "native_Process": (env => lazy(() => env["b"]()(env["maybeReturn"])(lazy(() => env["listBind"]()(env["syntaxToNative"])))))(env) }, env);
env = Object.assign({ "nativeExprToExe": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["c"]()(env["i"])(env["i"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strConss"])))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))(lazy(() => env["b"]()(env["ListCons"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(env["ListCons"])))))(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["two"])))))(env["ListEmpty"])))(env["ListEmpty"])))))))))))))))(env) }, env);
env = Object.assign({ "nativeDefToExe": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["strCons"])(lazy(() => env["c"]()(env["i"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["strConss"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["ListCons"])))(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["nativeExprToExe"])))(env["ListEmpty"])))))))))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(env["two"])))))(env["ListEmpty"])))))(env) }, env);
env = Object.assign({ "nativeToObj": (env => lazy(() => env["y"]()(lazy(() => env["b"]()(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["c"]()(env["i"])))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["c"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["Pair"])))(lazy(() => env["b"]()(env["maybeGetValue"])))))))(env["i"])))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["Pair"])))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["s"])(lazy(() => env["b"]()(lazy(() => env["b"]()(env["c"])))(lazy(() => env["b"]()(lazy(() => env["b"]()(lazy(() => env["b"]()(env["b"])))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["fst"])))))))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["fst"])))))))))))))))(env["i"])))))))(env) }, env);
env = Object.assign({ "native_Run": (env => lazy(() => env["b"]()(lazy(() => env["strFromMaybe"]()(env["i"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeMap"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeMap"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeBind"])(env["token_Process"])))(env["syntax_Process"])))))(lazy(() => env["listBind"]()(env["syntaxToNative"])))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["strJoin"])(lazy(() => env["map"]()(env["nativeDefToExe"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))))(env) }, env);
env = Object.assign({ "output_Process": (env => lazy(() => env["b"]()(env["strConss"])(lazy(() => env["map"]()(env["nativeDefToExe"])))))(env) }, env);
env = Object.assign({ "output_ProcessType": (env => lazy(() => env["b"]()(env["strConss"])(lazy(() => env["map"]()(lazy(() => env["b"]()(env["nativeDefToExe"])(env["nativeDefToTypeNative"])))))))(env) }, env);
env = Object.assign({ "pipeType": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeTryGetValue"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeMap"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeBind"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeBind"])(env["token_Process"])))(env["syntax_Process"])))))(env["native_Process"])))))(env["output_ProcessType"])))))(env["ListEmpty"])))(env) }, env);
env = Object.assign({ "pipe": (env => lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeTryGetValue"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeMap"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeBind"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeBind"])(env["token_Process"])))(env["syntax_Process"])))))(env["native_Process"])))))(env["output_Process"])))))(env["ListEmpty"])))(env) }, env);
env = Object.assign({ "fullDebug": (env => lazy(() => env["b"]()(env["strConss"])(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["ListCons"])(env["token_Run"])))(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(env["newLine"])))(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(env["newLine"])))(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))))(lazy(() => env["s"]()(lazy(() => env["b"]()(env["ListCons"])(env["syntax_Run"])))(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(env["newLine"])))(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(env["newLine"])))(lazy(() => env["b"]()(lazy(() => env["ListCons"]()(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["one"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["three"])(lazy(() => env["_qadd"]()(env["Zero"])(env["one"])))))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["two"])(lazy(() => env["_qadd"]()(env["two"])(env["three"])))))(lazy(() => env["ListCons"]()(lazy(() => env["_qadd"]()(env["Zero"])(lazy(() => env["_qadd"]()(env["Zero"])(env["two"])))))(env["ListEmpty"])))))))))))))))))))))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["ListCons"])(env["native_Run"])))(env["ListEmpty"])))))))))))))))))))))))(env) }, env);
env = Object.assign({ "run2": (env => lazy(() => env["b"]()(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeMap"])(lazy(() => env["c"]()(lazy(() => env["b"]()(env["maybeBind"])(env["token_Process"])))(env["syntax_Process"])))))))(lazy(() => env["b"]()(lazy(() => env["b"]()(env["fst"])))(lazy(() => env["c"]()(lazy(() => env["b"]()(env["b"])(env["nativeToObj"])))(lazy(() => env["b"]()(env["_syntaxToNative"])(env["head"])))))))))(env) }, env);
let native = '';
native += toString((name) => env['pipe'](name)(fromString("i = u u"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("k = u (u i)     "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("s = u k"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("b = s (k s) k"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("c = s (s (k s) (s (k k) s)) (k k)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("m = s i i"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("y = b m (c b (s i i))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("i = \\x x"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("k = \\a \\b a"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("s = \\a \\b \\c a c (b c)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("b = \\a \\b \\c a (b c)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("c = \\a \\b \\c a c b"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("m = \\x x x"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("y = \\f m (\\x f (x x))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("Bool = True | False"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("if = i"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("not = \\b b False True"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("lAnd = \\a \\b a b False"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("lOr = \\a \\b a True b"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("implies = \\a \\b a b True"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("xor = \\a \\b if a (not b) b"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eq = \\a \\b not $ xor a b"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("Nat = Zero | Succ n"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("one = Succ Zero"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("two = Succ one"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("three = Succ two"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("pred = \\n n Zero i"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isZero = \\n n True (k False)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("add = \\n \\m m n (\\dm add (Succ n) dm)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("sub = \\a \\b b a (\\db sub (pred a) db)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("mul = \\n \\m m Zero (\\dm add n (mul n dm))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("pow = \\n \\m m one (\\dm mul n (pow n dm))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_qadd = \\a \\n add a (mul (Succ three) n)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isEQ = \\a \\b lAnd (isZero $ sub a b) (isZero $ sub b a)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isLTE = \\a \\b isZero $ sub a b"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isGTE = \\a \\b isLTE b a"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isLT = \\a \\b not $ isGTE a b"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isGT = \\a \\b not $ isLTE a b"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("min = \\a \\b if(isLT a b) a b"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("max = \\a \\b if(isGT a b) a b"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("diff = \\a \\b if (isLT a b) (sub b a) (sub a b)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("mod = \\a \\b if(isLT a b) a (mod (sub a b) b)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("div = \\a \\b if(isLT a b) Zero (Succ (div (sub a b) b))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("Pair = Pair a b"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("fst = \\pair pair (\\a \\b a)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("snd = \\pair pair (\\a \\b b)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("changeFst = \\pair \\f pair (\\a \\b Pair (f a) b)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("changeSnd = \\pair \\f pair (\\a \\b Pair a (f b))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("List = ListEmpty | ListCons head tail"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listIsEmpty = \\list list True (\\head \\tail False)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listIsNotEmpty = b not listIsEmpty"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("head = \\list list i (\\head \\tail head)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("tail = \\list list i (\\head \\tail tail)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("foldl = \\l \\x \\f l\n            x\n            (\\head \\tail foldl tail (f x head) f)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("foldr = \\l \\x \\f l\n            x\n            (\\head \\tail f (foldr tail x f) head)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("reverseBag = \\a \\b a\n            b\n            (\\head \\tail reverseBag tail (ListCons head b))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("reverse = \\l reverseBag l ListEmpty"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("unfold = \\x \\f ListCons x (unfold (f x) f)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("repeat = \\elem unfold elem i"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listConcat = \\l \\k l k $ \\h \\t ListCons h $ listConcat t k\n    "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listReturn = \\x [x]"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listAddBack = \\l \\x listConcat l [x]"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cfold = \\l \\x \\f ListCons x (l ListEmpty (\\head \\tail cfold tail (f x head) f))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("take = \\n \\l\n    l\n        []\n        (\\head \\tail n \n            []\n            (\\dn ListCons head (take dn tail))\n        )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("takeWhile = \\p \\l \n    l\n        []\n        (\\head \\tail\n            if(not (p head))\n                []\n                (ListCons head $ takeWhile p tail)\n        )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("replicate = \\n \\x take n $ repeat x"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listBind = \\f \\l foldl l [] (\\a \\b listConcat a (f b))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("map = \\f \\l l [] $ \\h \\t ListCons (f h) $ map f t"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("filter = \\f \\l l [] $ \\head \\tail if (f head) (ListCons head) i $ filter f tail"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("drop = \\n \\l l [] $ \\head \\tail n l (\\n drop n tail)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("dropWhile = \\p \\l\n    l\n        []\n        (\\head \\tail \n            if(not (p head))\n                l\n                (dropWhile p tail)\n        )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("any = \\f \\l not $ listIsEmpty $ filter f l"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("all = \\f \\l not $ any (b not f) l"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("or = any i"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("and = all i"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("length = \\l foldl l Zero (b k Succ)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("zipWith = \\op \\l1 \\l2 \n    l1\n        ListEmpty\n        (\\h1 \\t1\n            l2\n                ListEmpty\n                (\\h2 \\t2\n                    ListCons \n                        (op h1 h2)\n                        (zipWith op t1 t2) \n                )\n        )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("zip = zipWith Pair"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listZipLonger = \\l1 \\l2 \\pad \\op \n    l1\n        (map (\\item2 op pad item2) l2)\n        (\\h1 \\t1\n            l2\n                (map (\\item1 op item1 pad) l1)\n                (\\h2 \\t2\n                    ListCons \n                        (op h1 h2)\n                        (listZipLonger t1 t2 pad op) \n                )\n        )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listEquals = \\eq \\l1 \\l2 lAnd (isEQ (length l1) (length l2)) (and $ zipWith eq l1 l2)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listMerge = \\lt \\l1 \\l2\n    l1\n        l2\n        (\\h1 \\t1\n            l2\n                l1\n                (\\h2 \\t2\n                    if (l1 h1 h2)\n                        (ListCons h1 $ listMerge lt t1 l2)\n                        (ListCons h2 $ listMerge lt l1 h2)\n                )\n        )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listSort = y(\\sort \\lt \\l if(isGT (length l) one) ((\\mid listMerge lt (sort lt (take mid l))  (sort lt (drop mid l))) (div (length l) two)) l)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("intSort = listSort isLT"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listElementAt = \\l \\n head $ drop n l"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listStartsWith = \\eq \\l1 \\l2 listEquals eq (take (length l2) l1) l2"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listJoin = \\lists \\sepa lists\n    ListEmpty \n    (\\head \\tail foldl tail head (\\cur \\new listConcat (listConcat cur sepa) new))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strIsEmpty = i listIsEmpty"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strIsNotEmpty = i b not strIsEmpty"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strEmpty = i ListEmpty"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strCons = i listConcat"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strStartsWith = i listStartsWith isEQ"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strJoin = \\strs \\sepa strs \"\" $ \\head \\tail foldl tail head (\\cur \\new strCons (strCons cur sepa) new)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strConss = \\strs strs \"\" $ \\head \\tail foldl tail head strCons"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strEquals = listEquals isEQ"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("Maybe = Just x | Nothing"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("maybeReturn = Just"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("maybeNothing = Nothing"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("maybeHasValue = Just_Dispatch (k True) False"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("maybeGetValue = Just_Dispatch i i"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("maybeBind = \\m \\f m f Nothing"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("maybeMap = \\m \\f m (b Just f) Nothing"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("maybeAlternative = \\m \\a m (k m) a"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("maybeTryGetValue = \\m \\a m i a"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_listIndexOfPred = \\l \\f \\offset l Nothing (\\head \\tail if(f head) (Just offset) (_listIndexOfPred tail f (Succ offset)))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listIndexOfPred = \\l \\f _listIndexOfPred l f 0"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listIndexOf = \\l \\eq \\x listIndexOfPred l (eq x)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_4 = Succ three"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_16 = mul _4 _4"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_32 = mul two _16"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_48 = mul three _16"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_10 = add two (add _4 _4)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("xstrFromNat = y(\\temp \\acc \\n if(isZero n) acc (temp (ListCons (add _48 (mod n _10)) acc) (div n _10)))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strFromN = \\n if(isZero n) [_48] (xstrFromNat strEmpty n)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strFromNs = listBind (\\n strCons (strFromN n) [_32])"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strToN = \\str foldl str Zero (\\i \\c add (mul i _10) (sub c _48))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strFromB = \\b if(b) \"True\" \"False\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strFromS = \\s strConss [[96], s, [96]]"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strFromPair = \\fa \\fb \\p strConss [\"(\", fa (fst p), \" ; \", fb (snd p), \")\"]"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("LabeledTree = LabeledVertex label children"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("LabeledBinTree = LabeledBinLeaf label | LabeledBinVertex label left right"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("LabeledOrderedBinTree = LabeledOrderedBinLeaf label | LabeledOrderedBinVertex label left right lt"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("RBTree = RBTreeLeaf | RBTreeNodeRed label left right lt | RBTreeNodeBlack label left right lt"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nats0 = unfold Zero Succ"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nats = unfold one Succ"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("byteVals = take 256 nats0"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("toBinSeq = \\n map (c mod 2) $ takeWhile (b not isZero) (unfold n (c div 2))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("fromBinSeq = \\l foldl (zipWith (\\a \\b mul a (pow 2 b)) l nats0) 0 add"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nxor = \\a \\b fromBinSeq (listZipLonger (toBinSeq a) (toBinSeq b) 0 (\\x \\y mod (add x y) 2))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isUpperCaseLetter = \\c lAnd (isGT c 64) (isLT c 91)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isLowerCaseLetter = \\c lOr (lAnd (isGT c 96) (isLT c 123)) (isEQ c 95)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isAlpha = \\c lOr (isUpperCaseLetter c) (isLowerCaseLetter c)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("alpha = filter isAlpha byteVals"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isNum = \\c lAnd (isGT c 47) (isLT c 58)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("num = filter isNum byteVals"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isAlphaNum = \\c lOr (isAlpha c) (isNum c)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isWhiteSpace = \\c isLT c 34"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("whiteSpace = filter isWhiteSpace byteVals"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("toUpperCaseLetter = \\c if(isLowerCaseLetter c) (add c 32) c"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("toLowerCaseLetter = \\c if(isUpperCaseLetter c) (sub c 32) c"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("toUpperCaseString = map toUpperCaseLetter"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("toLowerCaseString = map toLowerCaseLetter"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("halt = \\x (if x halt i) x"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("fak = \\n foldl (take n nats) 1 mul"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_nextCandids = \\prime \\candids (filter (\\n (not (isZero (mod n prime)))) candids)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_primes = \\candids (\\newPrime ListCons newPrime (_primes (_nextCandids newPrime candids))) (head candids)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("primes = _primes (tail nats)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("fibs = ListCons 1 $ ListCons 1 $ zipWith add fibs (tail fibs)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listCutAt = \\l \\f l (Pair [] l) $ \\h \\t if(f h) (Pair [] l) (changeFst (listCutAt t f) (ListCons h))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strFromSS = \\ss foldl ss strEmpty (\\s \\x strCons s (strCons x [10]))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("xlistSplitAt = \\l \\f unfold (listCutAt l (k True)) (\\p changeSnd (listCutAt (snd p) f) tail)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listSplitAt = \\l \\f listBind (\\x [snd x]) (listCutAt (tail (xlistSplitAt l f)) (\\x listIsEmpty (snd x)))\n "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listContains = \\list \\elem \\eq any (\\x eq elem x) list"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strContains = \\list \\elem listContains list elem isEQ"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listRepeat = \\n \\list listBind i (take n (repeat list))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strBurst = map (\\c [c])"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strTrim = \\str reverse $ dropWhile isWhiteSpace $ reverse $ dropWhile isWhiteSpace str"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("strFromMaybe = \\formatter \\m m (\\x strCons \"Just \" (formatter x)) \"Nothing\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("ParseResult = ParseResultFail | ParseResult remaining item"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseReturn = \\x (\\input ParseResult input x)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseFail = \\input ParseResultFail"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseOperation = \\conv \\res res ParseResultFail (\\remaining \\item ParseResult remaining (conv item))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseBindOperation = \\p \\conv (\\string parseOperation conv (p string))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parsePipe = \\p1 \\cp2 (\\input (p1 input) ParseResultFail (\\remaining \\item cp2 item remaining))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseBind = \\compose \\p1 \\p2 (\\input (p1 input) ParseResultFail (\\remaining \\item parseOperation (compose item) (p2 remaining)))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseBindDiscard = parseBind k"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseBindOverride = parseBind (k i)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseBindPair = parseBind Pair"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseCharIf = \\cond (\\string if (lAnd (not (listIsEmpty string)) (cond (head string))) (parseReturn (head string) (tail string)) (parseFail string))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseCharIf = \\cond (\\string string (parseFail string) $ \\head \\tail if (cond head) (parseReturn head tail) (parseFail string))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseCharX = \\set parseCharIf (\\c listContains set c isEQ)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseChar = \\c parseCharIf (isEQ c)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseSingle = parseCharIf (k True)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseString = \\str foldl (map parseChar str) (parseReturn strEmpty) (parseBind listAddBack)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseUntil = \\cond \\str (\\p parseReturn (fst p) (snd p)) (listCutAt str cond)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseWhile = \\cond parseUntil (b not cond)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseWhileMinOne = \\cond \\str (\\res if(listIsEmpty (ParseResult_Dispatch (\\remaining \\item item) \"\" res)) (parseFail str) res) (parseWhile cond str)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseOption = \\p1 \\p2 (\\string (p1 string) (p2 string) ParseResult)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseOptions = \\ps (\\string ps ParseResultFail (\\head \\tail (head string) (parseOptions tail string) ParseResult))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseWhitespace = parseWhile isWhiteSpace"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseWithWhitespace = \\p parseBindDiscard (parseBindOverride parseWhitespace p) parseWhitespace"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseToken = parseBind ListCons (parseCharIf isAlpha) (parseWhile isAlphaNum) "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parsenumber = parseBindOperation (parseWhileMinOne isNum) strToN"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseAccept = \\restFilter \\res res Nothing (\\remaining \\item if(restFilter remaining) (Just item) Nothing)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseAcceptAll = parseAccept (k True)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseAcceptFullyConsumed = parseAccept listIsEmpty"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("parseWhilesuccessful = \n    \\parser \\s \n        (parser s)\n            (ParseResult s ListEmpty)\n            (\\remaining \\item \n                (parseWhilesuccessful parser remaining)\n                ParseResultFail \n                (\\rremaining \\ritems ParseResult rremaining (ListCons item ritems))\n            ) "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("mapCreate = \\eq Pair eq ListEmpty"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("mapGetAll = \\map \\key filter (\\x fst map key (fst x)) (snd map)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("mapHasKey = \\map \\key any (k True) (mapGetAll map key)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("mapCount = b length snd"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("mapadd = \\map \\key \\value changeSnd map (ListCons (Pair key value))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("mapRemove = \\map \\key changeSnd map (filter (\\elem not (fst map key (fst elem))))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("mapSet = \\map \\key \\value mapadd (mapRemove map key) key value"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("mapGet = \\map \\key snd (head (mapGetAll map key))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("idfCreate = mapCreate"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("idfHandle = \\idf \\x if(mapHasKey idf x) (Pair idf (mapGet idf x)) ((\\id Pair (mapadd idf x id) id) (mapCount idf))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("idfHandleX = \\idf \\xs foldl xs (Pair idf ListEmpty) (\\pair \\x (\\res Pair (fst res) (listAddBack (snd pair) (snd res))) (idfHandle (fst pair) x))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("idfCount = mapCount"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listDistinct = \\l \\eq snd (foldl \n    l \n    (Pair (idfCreate eq) ListEmpty) \n    (\\pair \\x pair (\\pf \\ps \\res Pair (fst res) (if(isEQ (snd res) (idfCount pf)) (listAddBack ps x) ps)) (idfHandle (fst pair) x)))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("newLine = [10]"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("empty = [32]"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("gDrawL = \\w \\y \\f listBind (\\x (f x y)) (take w nats0)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("gDraw = \\w \\h \\f listBind (\\y listConcat (gDrawL w y f) newLine) (take h nats0)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("gCanvas = k (k empty)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("gOverlay = \\sel \\col \\canvas \\x \\y if (sel x y) [col] (canvas x y)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("gPixel = \\x \\y \\col gOverlay (\\xx \\yy lAnd (isEQ xx x) (isEQ yy y)) col"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("gCircle = \\x \\y \\s \\col gOverlay (\\xx \\yy isGT (pow s 2) (add (pow (diff xx x) 2) (pow (diff yy y) 2))) col    "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("beanEmpty = k Nothing"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("beanSet = \\mapping \\s \\x (\\query if(strEquals s query) (Just x) (mapping query))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("beanTryGet = \\mapping \\query mapping query"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("beanGet = \\mapping \\query maybeGetValue (mapping query)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("beanHas = \\mapping \\query maybeHasValue (mapping query)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("seqEmpty = Pair 0 i"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("seqLength = fst"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("seqGet = snd"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("seqSet = \\seq \\i \\x changeSnd seq (\\f \\ii if(isEQ i ii) x (f ii))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("seqaddFront = \\seq \\x Pair (Succ (seqLength seq)) (\\i if(isZero i) x (seqGet seq (pred i)))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("seqaddBack =  \\seq \\x Pair (Succ (seqLength seq)) (\\i if(isEQ i (seqLength seq)) x (seqGet seq i))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("seqConcat = \\s1 \\s2 Pair (add (seqLength s1) (seqLength s2)) (\\i if(isLT i (seqLength s1)) (seqGet s1 i) (seqGet s2 (sub i (seqLength s1))))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("seqRangeUnsafe = \\seq \\offset \\count Pair count (\\i seqGet seq (sub i offset))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("seqRange = \\seq \\offset \\count seqRangeUnsafe seq offset (min count (sub (seqLength seq) offset))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("seqToList = \\seq map (seqGet seq) $ take (seqLength seq) nats0"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("listToSeq = \\list foldr list seqEmpty (\\seq \\x seqaddFront seq x)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_switchCond = \\listpairxres \\alt \\cond foldr listpairxres alt (\\inner \\pair if(cond (fst pair)) (snd pair) inner)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("switchCond = \\cond \\listpairxres \\alt _switchCond listpairxres alt cond"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("switch = \\obj \\listpairxres \\cond \\alt switchCond (cond obj) listpairxres alt"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("switchN = \\obj \\listpairnumres \\alt switch obj listpairnumres isEQ alt"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("getFirstConsumeMoreDeferred = \\mf \\v v \n                 (\\a \n                    y(\\self \\n if(isZero n) a (k (self (pred n)))) (mf a)\n                 )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("getFirstConsumeMore = \\m getFirstConsumeMoreDeferred (k m)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eCharBrOpen = head \"(\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eCharBrClose = head \")\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eCharSqBrOpen = head \"[\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eCharSqBrClose = head \"]\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eCharComma = head \",\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eCharAbstr = head \"\\\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eCharOr = head \"|\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eCharAnd = head \"&\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eCharDollar = head \"$\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eCharAssign = 61"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eCharComment = 39"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eStrColon = [58]"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eIsQuot = \\x lOr (isEQ x 34) (isEQ x 96)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_eIsNewLine = \\x lOr (isEQ x 10) (isEQ x 13)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("Schar = ScharParenOpen\n      | ScharParenClose\n      | ScharAbstraction\n      | ScharAssign\n      | ScharSqBracketOpen\n      | ScharSqBracketClose\n      | ScharComma\n      | ScharSingleOr\n      | ScharDollar"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("scharID = \\s s 0 1 2 3 4 5 6 7 8"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("scharEQ = \\a \\b isEQ (scharID a) (scharID b)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("schar_String = \\x x\n        \"<PAR_OPEN>\"\n        \"<PAR_CLOSE>\"\n        \"<ABSTRACT>\"\n        \"<ASSIGN>\"\n        \"<SQBR_OPEN>\"\n        \"<SQBR_CLOSE>\"\n        \"<COMMA>\"\n        \"<SINGLE_OR>\"\n        \"<DOLLAR>\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("Token = TokenSpecialChar schar      \n      | TokenLiteralLower literal   \n      | TokenLiteralUpper literal   \n      | TokenConstS value           \n      | TokenConstN value           \n      | TokenComment value          "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("tokenLiteral = \\literal if(isLowerCaseLetter (head literal)) (TokenLiteralLower literal) (TokenLiteralUpper literal) "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("token_String = \\x x\n        schar_String\n        (\\literal strConss [\"<LITERALL(\", literal, \")>\"])\n        (\\literal strConss [\"<LITERALU(\", literal, \")>\"])\n        (\\value strConss [\"<CONSTS(\", value, \")>\"])\n        (\\value strConss [\"<CONSTN(\", strFromN value, \")>\"])\n        (k \"<COMMENT>\")"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("token_String_list = \\xs strJoin (map token_String xs) \" \""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatParenOpen        = parseBindOperation (parseChar _eCharBrOpen)    $ k $ TokenSpecialChar ScharParenOpen"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatParenClose       = parseBindOperation (parseChar _eCharBrClose)   $ k $ TokenSpecialChar ScharParenClose"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatSqBracketOpen    = parseBindOperation (parseChar _eCharSqBrOpen)  $ k $ TokenSpecialChar ScharSqBracketOpen"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatSqBracketClose   = parseBindOperation (parseChar _eCharSqBrClose) $ k $ TokenSpecialChar ScharSqBracketClose"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatComma            = parseBindOperation (parseChar _eCharComma)     $ k $ TokenSpecialChar ScharComma"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatAbstraction      = parseBindOperation (parseChar _eCharAbstr)     $ k $ TokenSpecialChar ScharAbstraction"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatAssign           = parseBindOperation (parseChar _eCharAssign)    $ k $ TokenSpecialChar ScharAssign"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatSingleOr         = parseBindOperation (parseChar _eCharOr)        $ k $ TokenSpecialChar ScharSingleOr"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatDollar           = parseBindOperation (parseChar _eCharDollar)    $ k $ TokenSpecialChar ScharDollar"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatLiteral = parseBindOperation parseToken (\\x tokenLiteral x)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatConstS  = parseBindOperation (parseBindOverride (parseCharIf _eIsQuot) (parseBindDiscard (parseUntil _eIsQuot) (parseCharIf _eIsQuot))) (\\x TokenConstS x)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatConstN  = parseBindOperation parsenumber (\\x TokenConstN x)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatComment = parseBindOperation (parseBindOverride (parseChar _eCharComment) (parseUntil _eIsNewLine)) (\\x TokenComment x)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatSpecialChar = parseOptions\n            [\n                eatParenOpen, \n                eatParenClose,\n                eatAbstraction,\n                eatAssign,\n                eatSqBracketOpen, \n                eatSqBracketClose, \n                eatComma,\n                eatSingleOr,\n                eatDollar\n            ]"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("eatSomething = parseWithWhitespace $ parseOptions \n        [ \n            eatSpecialChar,\n            eatLiteral, \n            eatConstS, \n            eatConstN,\n            eatComment\n        ]\n            "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("token_Process = b parseAcceptFullyConsumed $ parseWhilesuccessful eatSomething"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("token_Run = \\s (strFromMaybe i (maybeMap (token_Process s) token_String_list))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("SyntaxExpression = SyntaxName literal                             \n                 | SyntaxConstN value                             \n                 | SyntaxConstS value                             \n                 | SyntaxList list                                \n                 | SyntaxAbstraction literal body                 \n                 | SyntaxApplication o1 o2                        \n                 | SyntaxAssignment literal o                     \n                 | SyntaxType literalType listPairInstanceArgs    "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("syntaxCreateApplication = \\syntaxes foldl (tail syntaxes) (head syntaxes) SyntaxApplication"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("syntaxCreateAbstraction = \\literals \\body foldr literals body (\\x \\lit SyntaxAbstraction lit x)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("syntax_String = y $ \\this \\x\n    x\n        (\\literal strConss [\"literal(\", literal, \")\"])\n        (\\value strConss [\"constn(\", strFromN value, \")\"])\n        (\\value strConss [\"consts(\", value, \")\"])\n        (\\list strConss [\"list(\", strJoin (map this list) \", \", \")\"])\n        (\\literal \\body strConss [\"abstract(\", literal, \", \", this body, \")\"])\n        (\\o1 \\o2 strConss [\"apply(\", this o1, \", \", this o2, \")\"])\n        (\\literal \\o strConss [\"assign(\", literal, \", \", this o, \")\"])\n        (\\literalType \\listPairInstanceArgs strConss [\"type(\", literalType, \"; \", (strJoin (map (\\pair strCons (fst pair) (strConss (map (strCons \" \") (snd pair)))) listPairInstanceArgs) \", \"), \")\"])"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("syntax_String_list = \\xs strJoin (map syntax_String xs) \"; \""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseAbstractionTail = \\e \n    parsePipe\n        parseSingle\n        (TokenLiteralLower_Dispatch \n            (\\literal parseBindOperation \n                e\n                (\\rese [SyntaxAbstraction literal rese])\n            ) \n            parseFail)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseSChar = \\specialChar \n    parsePipe\n        parseSingle\n        (TokenSpecialChar_Dispatch  \n            (\\schar if(scharEQ specialChar schar)\n                (parseReturn i)\n                parseFail\n            )\n            parseFail)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseLiteralL = parsePipe\n        parseSingle\n        (TokenLiteralLower_Dispatch parseReturn parseFail)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseLiteralU = parsePipe\n        parseSingle\n        (TokenLiteralUpper_Dispatch parseReturn parseFail)\n        "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseCloseParen = cstrParseSChar ScharParenClose"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseCloseSqBr = cstrParseSChar ScharSqBracketClose"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseComma = cstrParseSChar ScharComma"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseAssign = cstrParseSChar ScharAssign"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseSingleOr = cstrParseSChar ScharSingleOr"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseDollar = cstrParseSChar ScharDollar"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseListTail = \\e parseBindDiscard \n                    (parseBindOperation \n                        (\n                            parseOption\n                            (\n                                parseBind\n                                    ListCons\n                                    e\n                                    (parseWhilesuccessful $ parseBindOverride cstrParseComma e)\n                            )\n                            (parseReturn ListEmpty)\n                        )\n                        (\\list [SyntaxList list])\n                    )\n                    cstrParseCloseSqBr"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseAssignTail = \\literal \\e parseBindOperation \n                        (parseBindOverride cstrParseAssign e)\n                        (\\body [SyntaxAssignment literal body])"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseDataDefOption = parseBind\n                            (\\name \\args Pair name args)\n                            cstrParseLiteralU\n                            (parseWhilesuccessful cstrParseLiteralL)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseDataDefTail2 = parseBind\n                            ListCons\n                            cstrParseDataDefOption\n                            (parseWhilesuccessful (parseBindOverride cstrParseSingleOr cstrParseDataDefOption))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrParseDataDefTail = \\literal \\e parseBindOperation \n                        (parseBindOverride cstrParseAssign cstrParseDataDefTail2) \n                        (\\list [SyntaxType literal list])"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrSyntaxSingle = \\e\n    parsePipe\n        parseSingle\n        (\\token token\n            (\\schar schar\n                (parseBindDiscard (parseBindOperation e listReturn) cstrParseCloseParen)\n                parseFail\n                (cstrParseAbstractionTail e)\n                parseFail\n                (cstrParseListTail e)\n                parseFail\n                parseFail\n                parseFail\n                parseFail\n            )\n            (\\literal \n                parseOption\n                    (cstrParseAssignTail literal e)\n                    (parseReturn [SyntaxName literal])\n            )\n            (\\literal \n                parseOption\n                    (cstrParseDataDefTail literal e)\n                    (parseReturn [SyntaxName literal])\n            )\n            (\\value parseReturn $ [SyntaxConstS value])\n            (\\value parseReturn $ [SyntaxConstN value])\n            (k parseReturn ListEmpty)\n        )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrSyntaxApplication = \\e \n                        parsePipe\n                            (parseWhilesuccessful $ cstrSyntaxSingle e)\n                            (\\list \n                                (\\ops \n                                    if(listIsEmpty ops) \n                                    parseFail\n                                    (parseBindOperation\n                                        (parseOption\n                                            (parseBindOperation (parseBindOverride cstrParseDollar e) listReturn)\n                                            (parseReturn ListEmpty)\n                                        )\n                                        (\\tailx listConcat ops tailx u $ \n                                            \\head \\tail foldl tail head SyntaxApplication)\n                                    )\n                                ) (listBind i list)\n                            )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("cstrSyntaxEverything = parseWhilesuccessful $ y cstrSyntaxApplication"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("syntax_Process = b parseAcceptFullyConsumed cstrSyntaxEverything"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("syntax_Run = \\s strFromMaybe i $ maybeMap (maybeBind (token_Process s) syntax_Process) syntax_String_list"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("NativeDefinition = NativeAssignment literal o   "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("NativeExpression = NativeLiteral literal        \n                 | NativeApplication o1 o2      \n        "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("getCollisionFreeLiteral = \\literal strCons \":arg:\" literal"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeExpr_String = y(\\this \\x\n    x\n        (\\literal strConss [\"literal(\", literal, \")\"])\n        (\\o1 \\o2 strConss [\"apply(\", this o1, \", \", this o2, \")\"])\n    )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeDef_String = y $ \\this \\x x $ \\literal \\o strConss [\"assign(\", literal, \", \", nativeExpr_String o, \")\"]\n    "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeDef_String_list = \\xs strJoin (map nativeExpr_String xs) \"; \""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeExpr_String_list = \\xs strJoin (map nativeDef_String xs) \"; \""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeI = NativeLiteral \":bound:i\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeK = NativeLiteral \":bound:k\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeB = NativeLiteral \":bound:b\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeC = NativeLiteral \":bound:c\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeS = NativeLiteral \":bound:s\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeY = NativeLiteral \":bound:y\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeListEmpty = NativeLiteral \"ListEmpty\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeListCons = NativeLiteral \"ListCons\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeStrToN = NativeLiteral \"strToN\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("native0 = NativeLiteral \"Zero\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("native1 = NativeLiteral \"one\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("native2 = NativeLiteral \"two\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("native3 = NativeLiteral \"three\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeSucc = NativeLiteral \"Succ\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeMul = NativeLiteral \"mul\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeQadd = NativeLiteral \"_qadd\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("isNativeLiteral = \\lit \\nat NativeLiteral_Dispatch \n        (\\literal strEquals lit literal)\n        False\n        nat"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeContainsLit = y(\\this \\n \\lit\n    n\n        (\\literal strEquals lit literal)\n        (\\o1 \\o2 lOr (this o1 lit) (this o2 lit))\n    )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("finalizeLiteral = \\s\n    if(strStartsWith s \":bound:\")\n        (drop 7 s)\n        s"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("finalizeNativeExpr =\n    y(\\this \\n\n        n\n            (\\literal NativeLiteral (finalizeLiteral literal))\n            (\\o1 \\o2 (\\a1 \\a2\n                (\\defres \n                    if(isNativeLiteral \"y\" a1)\n                    (\n                        NativeApplication_Dispatch\n                        (\\i1 \\i2 if(isNativeLiteral \"k\" i1) i2 defres)\n                        defres\n                        a2\n                    )\n                    defres\n                )\n                (NativeApplication a1 a2)\n            ) (this o1) (this o2))\n    )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("finalizeNativeDefs = \\n n (\\literal \\o NativeAssignment literal (finalizeNativeExpr o))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_03ToNative = \\n n native0 (\\n n native1 (\\n n native2 (\\n n native3 (k native0))))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_nToNative = \\n (\\d \\m\n    if (isZero d) \n        m \n        (NativeApplication \n            (NativeApplication \n                nativeQadd \n                m\n            ) \n            (_nToNative d)\n        )) (div n 4) (_03ToNative $ mod n 4)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_sToNative = \\value foldr value nativeListEmpty (\\value \\item NativeApplication (NativeApplication nativeListCons (_nToNative item)) value)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_syntaxToNative = y $ \\this \\syntax\n    syntax\n        (\\literal NativeLiteral literal)\n        _nToNative\n        _sToNative\n        (\\list foldr list nativeListEmpty (\\list \\item NativeApplication (NativeApplication nativeListCons (this item)) list))\n        (\\literal \\body \n            (y(\\strip \\lit \\nbody\n                NativeApplication_Dispatch\n                (\\a \\b\n                    if (nativeContainsLit a lit)\n                    (\n                        if (nativeContainsLit b lit)\n                        (NativeApplication (NativeApplication nativeS (strip lit a)) (strip lit b))\n                        (NativeApplication (NativeApplication nativeC (strip lit a)) b)\n                    )\n                    (\n                        if (nativeContainsLit b lit)\n                        ( \n                            if(NativeLiteral_Dispatch (k True) False b)\n                            a\n                            (NativeApplication (NativeApplication nativeB a) (strip lit b))\n                        )\n                        (NativeApplication nativeK nbody)\n                    )\n                )\n                (\n                    if (nativeContainsLit nbody lit)\n                    nativeI\n                    (NativeApplication nativeK nbody)\n                )\n                nbody\n            )) \n            literal \n            (this body)\n        )\n        (\\o1 \\o2 NativeApplication (this o1) (this o2))\n        (\\literal \\o NativeAssignment \"fail\" (_sToNative \"fail\"))\n        (\\typeLiteral NativeAssignment \"fail\" (_sToNative \"fail\")) \n    "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_createUniqueNameFromN = \\n strCons \":bound:\" (strFromN n)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_createUniqueNameFromS = \\s strCons \":bound:\" s"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_syntaxEmitTypeInstance = \\items \\ctrArgList \\index \\args \\name\n    [\n        NativeAssignment \n            name\n            (\n                _syntaxToNative\n                (syntaxCreateAbstraction (listConcat args ctrArgList) (syntaxCreateApplication (map SyntaxName (ListCons (_createUniqueNameFromN index) args))))\n            ),\n        NativeAssignment\n            (strCons name \"_Dispatch\")\n            (\n                _syntaxToNative\n                (\n                    (\\argDisp \\argAlt \\argItem syntaxCreateAbstraction [argDisp, argAlt, argItem] \n                        (syntaxCreateApplication \n                            (ListCons \n                                (SyntaxName argItem)\n                                (map (\\item \n                                    if(isEQ index (snd item)) \n                                        (SyntaxName argDisp)\n                                        (syntaxCreateAbstraction (snd (fst item)) (SyntaxName argAlt))\n                                ) items)\n                            )\n                        )\n                    )\n                    (_createUniqueNameFromS \"disp\")\n                    (_createUniqueNameFromS \"alt\")\n                    (_createUniqueNameFromS \"item\")\n                )\n            )\n    ]"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_syntaxEmitTypeStuff = \\typeName \\items \\ctrArgList \n    (\n        listBind \n        (\\item \n            (\\pair \\index _syntaxEmitTypeInstance items ctrArgList index (snd pair) (fst pair))\n            (fst item)\n            (snd item)\n        )\n        items\n    )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_make__ValueDef = \\syntaxExpression SyntaxAssignment \"__value\" syntaxExpression"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_syntaxToNativeDefs = \\syntax\n    syntax\n        (\\literal       _syntaxToNativeDefs $ _make__ValueDef syntax)\n        (\\value         _syntaxToNativeDefs $ _make__ValueDef syntax)\n        (\\value         _syntaxToNativeDefs $ _make__ValueDef syntax)\n        (\\list          _syntaxToNativeDefs $ _make__ValueDef syntax)\n        (\\literal \\body _syntaxToNativeDefs $ _make__ValueDef syntax)\n        (\\o1 \\o2        _syntaxToNativeDefs $ _make__ValueDef syntax)\n        \n        (\\literal \\o listReturn (NativeAssignment literal \n            (NativeApplication nativeY \n                (_syntaxToNative (SyntaxAbstraction literal o))\n            )))   \n        (\\typeLiteral \\pairs \n            (\\optionCount \\items\n                (\\ctrArgList _syntaxEmitTypeStuff typeLiteral items ctrArgList)\n                (map _createUniqueNameFromN $ take optionCount nats0)\n            )\n            (length pairs)\n            (zip pairs nats0)\n        )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("syntaxToNative = \\s map finalizeNativeDefs (_syntaxToNativeDefs s)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_nlB = NativeLiteral \"b\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_nlMB = NativeLiteral \"maybeBind\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("_nlTA = NativeLiteral \"typeApply\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeToTypeNative = \\native native\n            (\\literal NativeLiteral (strCons literal \"_Type\"))\n            (\\o1 \\o2 \n                NativeApplication\n                    (NativeApplication _nlMB (nativeToTypeNative o1))\n                    (NativeApplication \n                        (NativeApplication \n                            _nlB\n                            (NativeApplication _nlMB (nativeToTypeNative o2))) \n                        _nlTA)\n            )"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeDefToTypeNative = \\native native\n            (\\literal \\o NativeAssignment\n                (strCons literal \"_Type\")\n                (nativeToTypeNative o)\n            )\n        "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("native_Process = \\synts maybeReturn $ listBind syntaxToNative synts"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeExprToExe = \\n n\n            (\\literal literal)\n            (\\o1 \\o2 (strConss [nativeExprToExe o1, \" \", nativeExprToExe o2, \".\"]))"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeDefToExe = \\n strCons (n (\\literal \\o (strConss [literal, \" \", nativeExprToExe o]))) \".\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("nativeToObj = y $ \\this \\env \\n n\n        (\\literal Pair (maybeGetValue (env literal)) env) \n        (\\o1 \\o2  Pair ((fst (this env o1)) (fst (this env o2))) env)"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("native_Run = \\s strFromMaybe i $ maybeMap \n                                    (maybeMap (maybeBind (token_Process s) syntax_Process) (listBind syntaxToNative))\n                                    (\\ns strJoin (map nativeDefToExe ns) \"; \")\n                                    "))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("output_Process = \\natives strConss $ map nativeDefToExe natives"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("output_ProcessType = \\natives strConss $ map (b nativeDefToExe nativeDefToTypeNative) natives"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("pipeType = \\s\n    maybeTryGetValue (\n    maybeMap (\n    maybeBind (\n    maybeBind \n        (token_Process s)\n        syntax_Process)\n        native_Process)\n        output_ProcessType)\n    \"\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("pipe = \\s\n    maybeTryGetValue (\n    maybeMap (\n    maybeBind (\n    maybeBind \n        (token_Process s)\n        syntax_Process)\n        native_Process)\n        output_Process)\n    \"\""))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("fullDebug = \\s strConss\n    [\n        \"LEXER:   \", token_Run s,\n        newLine, newLine,\n        \"PARSER:  \", syntax_Run s,\n        newLine, newLine,\n        \"CODEGEN: \", native_Run s\n    ]"))).trim();
process.stderr.write('.');

native += toString((name) => env['pipe'](name)(fromString("run2 = \\menv \\str maybeMap \n                    (maybeBind (token_Process str) syntax_Process) \n                    (\\synt fst \n                            (nativeToObj\n                                menv\n                                (_syntaxToNative $ head synt)\n                    ))"))).trim();
process.stderr.write('.');

require('fs').writeFileSync(
  __dirname + "/../../www/library/prelude.native.txt",
  native + '\n');
