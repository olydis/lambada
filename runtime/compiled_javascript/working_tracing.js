const DEBUG_STACK = [];

const lazy = name => f => {
  let result = null;
  return name => {
    if (name === undefined) throw new Error("Pass callsite name");
    DEBUG_STACK.push(name);
    name && console.error(DEBUG_STACK);
    // name && console.count(name);
    const r = result || (result = f(name));
    DEBUG_STACK.pop();
    // console.error(new Error().stack);
    return r;
  };
};

// Singularity
// const _k = name => a => b => a(name);
// const _s = name => a => b => c => a(name)(c)(name2 => b(name + "~" + name2)(c));
// const u = name => x => x(name)(_s)(_k);
// u.trace = ['u'];

// const i = lazy(["i", ["u", "u"]])(() => u(i)(u));
// const k = lazy(["k", ["u", ["u", "i"]]])(() => u("k0")(lazy("k1")(() => u("k10")(i))));
// const s = lazy(["s", ["u", "k"]])(() => u("s0")(k));

const norm = e => (Array.isArray(e[0]) ? norm(e[0].concat(e.slice(1))) : e);
const hasNull = msg =>
  msg === null || (Array.isArray(msg) && msg.some(hasNull));
const print = (e, p = true) =>
  Array.isArray(e) ? (x => (p ? `(${x})` : x))(e.map(print).join(" ")) : e;
const trace = msg =>
  (msg => (hasNull(msg) || console.error(print(msg, false)), msg))(norm(msg));
const trace2 = (subst, e) => trace(subst.concat(e.slice(1)));

// const i = (e) => a => a(trace(e.slice(1)));
const _k = e => a => b => a(trace([e[1]].concat(e.slice(3))));
const _s = e => a => b => c =>
  a(trace([e[1], e[3], [e[2], e[3]]].concat(e.slice(4))))(c)(e => b(e)(c));
const u = e => x =>
  x(trace([e[1], /*S*/ null, /*K*/ null].concat(e.slice(2))))(_s)(_k);

// Note: it's okay for `u` to strictly evaluate its argument "x" (e.g. to see what it is),
//       since it becomes the head of "x S K" anyways!
// const tag = (tag, f) => ((f.tag = tag), f);
// const u = (e) => x =>
//   x === u
//     ? tag("i", y => y(trace(e.slice(2))))
//     : ((y, e) =>
//         y.tag === "i"
//           ? tag("sk", y => z => z(trace(e.slice(2))))
//           : y.tag === "sk"
//           ? tag("k", a => b => a(trace([e[0]].concat(e.slice(2)))))
//           : y.tag === "k"
//           ? tag("s", a => b => c =>
//               a(trace([e[0], e[2], [e[1], e[2]]].concat(e.slice(3))))(c)(
//                 (e) => b(e)(c)
//               )
//             )
//           : x(trace([e[1], "S", "K"].concat(e.slice(2))))(s)(k))(
//         x([e[1], "STRICT"]),
//         e.slice(2)
//       );
// Note: The above is bad since a) it results in funky traces due to out of order eval, b) can never be complete that way

const i = e => u(trace2(["u", "u"], e))(u);
const k = e => u(trace2(["u", ["u", "i"]], e))(e => u(e)(i));
const s = e => u(trace2(["u", "k"], e))(k);
const m = e => s(trace2(["s", "i", "i"], e))(i)(i);

// Code gen end

s(trace(["s", "k", "k", "k"]))(k)(k)(k);
console.log();
s(trace(["s", "i", "k", "i", "i"]))(i)(k)(i)(i);
console.log();
i(trace(["i", "i", "s"]))(i)(s);
console.log();
k(trace(["k", "i", "k", "s"]))(i)(k)(s);
console.log();
m(trace(["m", "k"]))(k);
process.exit(0);
