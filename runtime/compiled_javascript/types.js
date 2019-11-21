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

const i = (a => arrow(a, a))(prim());
const k = ((a, b) => arrow(a, arrow(b, a)))(prim(), prim());
const s = ((a, b, c) => arrow(arrow(c, arrow(b, a)), arrow(arrow(c, b), arrow(c, a))))(prim(), prim(), prim());
const u = (x => arrow(arrow(clone(s), arrow(clone(k), x)), x))(prim());

function app(a, b) {
    const { from: formalParam, to: result } = clone(a);
    const actualParam = clone(b);
    let constraints = [prim(), result, formalParam, actualParam];

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
    const assignAll = (a, b, cs, force=false) => {
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
        const res = assignAll(assgn[0], assgn[1], cs);
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
    const mirrorConstraints = cs => {
        cs = cs.slice();
        for (let i = 0; i < cs.length; i += 2) {
            const t = cs[i];
            cs[i] = cs[i + 1];
            cs[i + 1] = t;
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

    printConstraints(constraints);
    step();
    printConstraints(constraints);
    step();
    printConstraints(constraints);
    step();
    printConstraints(constraints);
    step();
    printConstraints(constraints);
    step();
    printConstraints(constraints);
    step();
    printConstraints(constraints);
    step();
    printConstraints(constraints);
}

// Goal: (1 -> 1)
// 3  :=   (2 -> 3) -> 1
// 1  :=   2


const printConstraints = cs => {
    cs = print(...cs);
    console.log();
    console.log("Goal: " + cs[1]);
    for (let i = 2; i < cs.length; i += 2)
        console.log(pad(cs[i], 25) + "   :=   " + cs[i + 1]);
};

const si = ((a, b) => arrow(arrow(arrow(a, b), a), arrow(arrow(a, b), b)))(prim(), prim());
app(u, u);
// app(s, k);
// app(si, i);
// app(s, i);
// app(i, i);



// ((1 -> 2) -> 1) -> ((1 -> 2) -> 2)
// (0 -> 1) -> 1     with     0 := (0 -> 1)

// ((0 -> 1) -> 1) ((2 -> 3) -> 3)
// with     0 := (0 -> 1)
// with     2 := (2 -> 3)

// 1
// 3
// 0.b
// BOTTOM

// 1 := 3
// 3 := 0.b
// 0.a := 2
// 0.a := 1
// 0 := 0.b



// 0
// 3.a
// 5
// 9 -> 10
// 9 -> 4.a.a
// 6.b && 4.b  -> 4.a.a
// 7.b && 4.b  -> 4.a.a
// 4.b  -> 4.a.a
// 3.b.b  -> 4.a.a
// 1  -> 4.a.a
// 3.b.a.a  -> 4.a.a
// 4.a.a -> 4.a.a

// ((1 -> (2 -> 1)) -> 0)      :=   3
// 3                           :=   (4 -> 5)
// 6                           :=   (7 -> 8)
// 8                           :=   4
// 5                           :=   (9 -> 10)
// (9 -> 11)                   :=   6
// (9 -> (11 -> 10))           :=   4
