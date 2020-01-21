const norm = e => (Array.isArray(e[0]) ? norm(e[0].concat(e.slice(1))) : e);
const hasNull = msg =>
  msg === null || (Array.isArray(msg) && msg.some(hasNull));
const print = (e, p = true) =>
  Array.isArray(e) ? (x => (p ? `(${x})` : x))(e.map(print).join(" ")) : e;
const trace = msg =>
  (msg => (hasNull(msg) || console.error(print(msg, false)), msg))(norm(msg));
const trace2 = (subst, e) => trace(subst.concat(e.slice(1)));

const lazy = f => {
  let result = null;
  return e => {
    const r = false && result || (result = f(e));
    return r;
  };
};

// const i = (e) => a => a(trace(e.slice(1)));
const _k = lazy(e => a => b => a(trace([e[1]].concat(e.slice(3)))));
const _s = lazy(e => a => b => c =>
  a(trace([e[1], e[3], [e[2], e[3]]].concat(e.slice(4))))(c)(lazy(e => b(e)(c)))
);
const u = lazy(e => x =>
  x(trace([e[1], /*S*/ null, /*K*/ null].concat(e.slice(2))))(_s)(_k)
);
u.symbol = { name: 'u' };

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

// const i = e => u(trace2(["u", "u"], e))(u);
// u.symbol = { name: 'i' };
// const k = e => u(trace2(["u", ["u", "i"]], e))(e => u(e)(i));
// const s = e => u(trace2(["u", "k"], e))(k);
// const m = e => s(trace2(["s", "i", "i"], e))(i)(i);

// // Code gen end

// s(trace(["s", "k", "k", "k"]))(k)(k)(k);
// console.log();
// s(trace(["s", "i", "k", "i", "i"]))(i)(k)(i)(i);
// console.log();
// i(trace(["i", "i", "s"]))(i)(s);
// console.log();
// k(trace(["k", "i", "k", "s"]))(i)(k)(s);
// console.log();
// m(trace(["m", "k"]))(k);
// process.exit(0);

const share = x => x;

const i = share(() => u()(u))
const k = share(() => u()(share(() => u()(i))))
const s = share(() => u()(k))
const m = share(() => s()(i)(i))
const y = share(() => b()(m)(share(() => c()(b)(m))))

const i = share(() => x => x())
const k = share(() => a => b => a())
const s = share(() => a => b => c => a()(c)(share(() => b()(c))))
const m = share(() => x => x()(x))
const y = share(() => f => m()(share(() => x => f()(x)(x))))

// Code gen end
process.exit(0);
