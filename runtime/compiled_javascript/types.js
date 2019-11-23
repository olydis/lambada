function clone(x, bag = new WeakMap()) {
    if (typeof x !== 'object') return x;
    if (bag.has(x)) return bag.get(x);
    const result = Array.isArray(x) ? [] : {};
    bag.set(x, result);
    for (const [key, value] of Object.entries(x)) result[key] = clone(value, bag);
    return result;
}
function contains(x, y) {
    const bag = new Map();
    clone(x, bag);
    return bag.contains(y);
}

// type Type = [] | { from: Type, to: Type };
const prim = () => [];
const arrow = (from, to) => ({ from, to });
const isArrow = t => 'from' in t && 'to' in t;
function print(...x) {
    const map = new Map();
    x.forEach(x => clone(x, map));
    let i = 0;
    [...map.keys()].forEach(key => isArrow(key) ? map.delete(key) : map.set(key, i++));
    const labelled = x.map(x => clone(x, map));
    const str = x => typeof x === 'number' ? `${x}` : `(${str(x.from)} -> ${str(x.to)})`;
    return labelled.map(str);
}
const pad = (s, l) => {
    while (s.length < l) s += ' ';
    return s;
}

const i = [prim(), (a => arrow(a, a))(prim())];
const k = [prim(), ((a, b) => arrow(a, arrow(b, a)))(prim(), prim())];
// const s = ((a, b, c1, c2, c3) => [prim(), arrow(arrow(c1, arrow(b, a)), arrow(arrow(c2, b), arrow(c3, a))), c1, c3, c2, c3])(prim(), prim(), prim(), prim(), prim());
const s = ((a, b, c) => [prim(), arrow(arrow(c, arrow(b, a)), arrow(arrow(c, b), arrow(c, a)))])(prim(), prim(), prim());
const u = clone([prim(), (x => arrow(arrow(s[1], arrow(k[1], x)), x))(prim())]);

const mirrorConstraints = cs => {
    cs = cs.slice();
    for (let i = 0; i < cs.length; i += 2) {
        const t = cs[i];
        cs[i] = cs[i + 1];
        cs[i + 1] = t;
    }
    return cs;
};
function app(a, b, print = null) {
    a = clone(a);
    b = clone(b);
    const { from: formalParam, to: result } = a[1];
    const actualParam = b[1];
    let constraints = [prim(), result, formalParam, actualParam, ...a.slice(2), ...b.slice(2)];

    function* enumConstraints(a, b) {
        if (isArrow(a) && isArrow(b)) {
            yield* enumConstraints(a.to, b.to);
            yield* enumConstraints(b.from, a.from);
        }
        else {
            yield { to: a, from: b };
        }
    };
    const explodeConstraints = cs => {
        const res = [];
        for (let i = 0; i < cs.length; i += 2)
            for (const c of enumConstraints(cs[i], cs[i + 1]))
                res.push(c.to, c.from);
        return res;
    }
    // a := b    in x -> y
    // if flip, flips result arrow
    const assign = (a, b, x, y, flip = false, force = false) => {
        if (isArrow(a)) return null;
        const xr = isArrow(x) ? assign(a, b, x.to, x.from, true, force) : (x === a ? (force ? b : null) : x);
        const yr = isArrow(y) ? assign(a, b, y.from, y.to, false, force) : (y === a ? b : y);
        return xr && yr && (flip ? arrow(yr, xr) : arrow(xr, yr));
    };
    // a := b    in cs
    const assignAll = (a, b, cs, force = false) => {
        for (let i = 0; i < cs.length; i += 2) {
            const res = assign(a, b, cs[i], cs[i + 1], false, force);
            if (res === null) return null;
            cs[i] = res.from;
            cs[i + 1] = res.to;
        }
        return cs;
    };
    const assignFlat = (cs, i) => {
        cs = cs.slice();
        const assgn = cs.slice(i, i + 2);
        cs[i] = cs[i + 1];
        // if (contains(assgn[1], assgn[0]))
        let res = assignAll(assgn[0], assgn[1], cs);
        if (!res) {
            // maybe prune?
            // check if assgn[0] only appears in same polarization => no recursion
            // and also not anywhere else
            const pos = cs.slice();
            const neg = mirrorConstraints(cs.slice());
            pos[i] = assgn[1];
            pos[i + 1] = prim();
            neg[i] = prim();
            neg[i + 1] = prim();
            res = assignAll(assgn[0], assgn[1], pos.concat(neg));
            if (res) {
                res = cs;

            }
        }
        if (res) res.splice(i, 2);
        return res;
    };
    const assignFlatAll = cs => {
        for (let i = cs.length - 2; i >= 2; i -= 2) {
            const csnew = assignFlat(cs, i);
            if (csnew !== null) cs = csnew;
        }
        return cs;
    };
    const explode = (cs, x) => assignAll(x, arrow(prim(), prim()), cs, true);
    const explodeRhs = cs => {
        for (let i = 1; i < cs.length; i += 2) {
            if (!isArrow(cs[i])) {
                const csnew = explode(cs, cs[i]);
                if (csnew !== null) return csnew;
            }
        }
        return cs;
    };

    const step = () => {
        constraints = explodeConstraints(constraints);

        constraints = assignFlatAll(constraints);
        constraints = mirrorConstraints(constraints);
        constraints = assignFlatAll(constraints);
        constraints = mirrorConstraints(constraints);
        constraints = explodeRhs(constraints);
    };

    // printConstraints(constraints);
    // constraints = explodeConstraints(constraints);
    // printConstraints(constraints);
    // constraints = assignFlatAll(constraints);
    // printConstraints(constraints);

    for (let i = 0; i < 10; i++) {
        // if (print) printConstraints(constraints, print);
        step();
    }
    if (print) printConstraints(constraints, print);

    return constraints;
}

// Goal: (1 -> 1)
// 3  :=   (2 -> 3) -> 1
// 1  :=   2


const printConstraints = (cs, name) => {
    cs = print(...cs);
    console.log();
    console.log(name + " :: " + cs[1]);
    for (let i = 2; i < cs.length; i += 2)
        console.log(pad(cs[i], 25) + "   :=   " + cs[i + 1]);
};

const sk = app(s, k, 'S K');
const ii = app(sk, k, 'I');
const si = app(s, i, 'S I');
// const m = ((a, b) => [prim(), arrow(a, b), a, arrow(a, b)])(prim(), prim());
const m = app(si, i, 'M');
const ks = app(k, s, 'K S');
const kk = app(k, k, 'K K');
const siks = app(si, ks, '(S I) (K S)');
const ssiks = app(s, siks, 'S ((S I) (K S))');
const ssikskk = app(ssiks, kk, 'U'); // u
const is = app(i, s, 'S');
const uu = app(u, u, 'I');
const sks = app(s, ks, 'S (K S)');
const b = app(sks, k, 'B');
const skk = app(s, kk, 'S (K K)');
const skks = app(skk, s, 'S (K K) S');
const sksskks = app(sks, skks, 'S (K S) (S (K K) S)');
const ssksskks = app(s, sksskks, 'S (S (K S) (S (K K) S))');
const c = ((a, b, c) => [prim(), arrow(arrow(c, arrow(b, a)), arrow(b, arrow(c, a)))])(prim(), prim(), prim());
// const c = app(ssksskks, kk, 'C');

const cb = app(c, b, 'C B');
const cbm = app(cb, m, 'C B M');
const bm = app(b, m, 'B M');
const y = app(bm, cbm, 'Y');

// c = s (s (k s) (s (k k) s)) (k k)
// m = s i i

// y = b m (c b m)

