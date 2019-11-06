const _s = a => b => c => a()(c)(b()(c));
const _k = a => b => a;
const u = x => x()(_s)(_k);

const lazy = f => {
  let result = null;
  return () => result || (result = f());
};

let env = { u: () => u };
env = Object.assign({ "i": () => a => a }, env);
env = Object.assign({ "k": () => a => b => a }, env);
env = Object.assign({ "s": () => a => b => c => a()(c)(() => b()(c)()) }, env);
env = Object.assign({ "b": () => a => b => c => a()(b()(c)) }, env);
env = Object.assign({ "c": () => a => b => c => a()(c)(b) }, env);
env = Object.assign({ "m": () => x => x()(x) }, env);
env = Object.assign(
  (
    ({ "y": () => env["b"]()(env["m"])(env["c"]()(env["b"])(env["m"])) })
  )
  , env);
env = Object.assign(
  (
    f => ({ "Zero": x => f()(x) })
  )
    (
    (env => lazy(() => env["k"]))
      (env)
    ),
  env);
env = Object.assign(
  (
    f => ({ "Succ": x => f()(x) })
  )
    (
    (env => lazy(() => env["b"](env["k"])(env["c"](env["i"]))))
      (env)
    ),
  env);
env = Object.assign(
  (
    f => ({ "add": x => f()(x) })
  )
    (
    (env => lazy(() => env["y"](env["b"](env["s"](env["b"](env["c"])(env["c"](env["i"]))))(env["c"](env["b"])(env["Succ"])))))
      (env)
    ),
  env);


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
const toString = f => toList(f).map(toNat).map(Number).map(String.fromCharCode);

// const y = env["m"]()(env["b"]()(() => x => 3)(env["m"]));
// const n = env['add'](env['Zero'])(env['Zero']);
console.log(env["s"]()(() => a => b => a)(() => null)(() => 2)());
// console.log(toNat(n));
// console.log(env['dullDebug'](x => y => x)(x => y => x)(42));
