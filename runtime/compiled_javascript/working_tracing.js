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

const norm = e => (Array.isArray(e[0]) ? e[0].concat(e.slice(1)) : e);
const hasNull = msg =>
  msg === null || (Array.isArray(msg) && msg.some(hasNull));
const trace = msg =>
  (msg => (hasNull(msg) || console.error(msg), msg))(norm(msg));

// const i = (trace, e) => a => a(trace, trace(e.slice(1)));
const _k = (trace, e) => a => b => a(trace, trace([e[1]].concat(e.slice(3))));
const _s = (trace, e) => a => b => c =>
  a(trace, trace([e[1], e[3], [e[2], e[3]]].concat(e.slice(4))))(c)(
    (trace, e) => b(trace, e)(c)
  );
const u = (trace, e) => x =>
  x(trace, trace([e[1], /*S*/ null, /*K*/ null].concat(e.slice(2))))(_s)(_k);

// Note: it's okay for `u` to strictly evaluate its argument "x" (e.g. to see what it is),
//       since it becomes the head of "x S K" anyways!
// const tag = (tag, f) => ((f.tag = tag), f);
// const u = (trace, e) => x =>
//   x === u
//     ? tag("i", y => y(trace, trace(e.slice(2))))
//     : ((y, e) =>
//         y.tag === "i"
//           ? tag("sk", y => z => z(trace, trace(e.slice(2))))
//           : y.tag === "sk"
//           ? tag("k", a => b => a(trace, trace([e[0]].concat(e.slice(2)))))
//           : y.tag === "k"
//           ? tag("s", a => b => c =>
//               a(trace, trace([e[0], e[2], [e[1], e[2]]].concat(e.slice(3))))(c)(
//                 (trace, e) => b(trace, e)(c)
//               )
//             )
//           : x(trace, trace([e[1], "S", "K"].concat(e.slice(2))))(s)(k))(
//         x(trace, [e[1], "STRICT"]),
//         e.slice(2)
//       );
// Note: The above is bad since a) it results in funky traces due to out of order eval, b) can never be complete that way

const i = (trace, e) => u(trace, trace(["u", "u"].concat(e.slice(1))))(u);
const k = (trace, e) =>
  u(trace, trace(["u", ["u", "i"]].concat(e.slice(1))))((trace, e) =>
    u(trace, e)(i)
  );
const s = (trace, e) => u(trace, trace(["u", "k"].concat(e.slice(1))))(k);
const m = (trace, e) =>
  s(trace, trace(["s", "i", "i"].concat(e.slice(1))))(i)(i);

// Code gen end

s(trace, trace(["s", "k", "k", "k"]))(k)(k)(k);
console.log();
s(trace, trace(["s", "i", "k", "i", "i"]))(i)(k)(i)(i);
console.log();
i(trace, trace(["i", "i", "s"]))(i)(s);
console.log();
k(trace, trace(["k", "i", "k", "s"]))(i)(k)(s);
console.log();
m(trace, trace(["m", "k"]))(k);
process.exit(0);
