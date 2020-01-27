# Proofs

## Strategies A and B are equivalent

We give a translation scheme between terms of both strategies and show that a reduction in either strategy implies an equivalent reduction in the other strategy.
We only focus on reduction rules at the root of expressions.
Both reduction strategies are compositional in that they can operate on arbitrary subexressions in isolation.

### Translation of Strategy A terms to Strategy B terms

Assume that the following cases are matched top to bottom.
Intermediate terms of the translation are `Expr`, but with variables `α` from lambda terms, before they are eliminated.
To distinguish them from `u`, `k` and `s` we will embed writing `<α>`.

``` Haskell
elim(α, β) = k β    -- if β does not contain <α>
elim(α, <α>) = u u
elim(α, β γ) = s elim(α, β) elim(α, γ)

a2b(α β) = a2b(α) a2b(β)
a2b(\α -> β) = elim(α, a2b(β))
a2b(α) = <α>
```

Since lambda terms occuring in Strategy A are closed, no embedded variables `<α>` remain.

### Translation of Strategy B terms to Strategy A terms

``` Haskell
b2a(u) = \x -> x b2a(s) b2a(k)
b2a(k) = \a -> \b -> a
b2a(s) = \a -> \b -> \c -> a c (b c)
b2a(α β) = b2a(α) b2a(β)
```

### Recudction in Strategy A implies reduction in Strategy B

Structural induction on beta-reduction `(\α -> γ) β ⟶ γ[β/α]`:

``` Haskell
Case: γ does not contain <α>

a2b((\α -> γ) β) =
a2b(\α -> γ) a2b(β) =
elim(α, a2b(γ)) a2b(β) =
k a2b(γ) a2b(β) ⟶
a2b(γ) =
a2b(γ[β/α])


Case: γ = α

a2b((\α -> α) β) =
a2b(\α -> α) a2b(β) =
elim(α, a2b(α)) a2b(β) =
elim(α, <α>) a2b(β) =
u u a2b(β) ⟶
u s k a2b(β) ⟶
s s k k a2b(β) ⟶
s k (k k) a2b(β) ⟶
k a2b(β) (k k a2b(β)) ⟶
a2b(β) =
a2b(α[β/α])


Case: γ = κ δ

a2b((\α -> κ δ) β) =
a2b(\α -> κ δ) a2b(β) =
elim(α, a2b(κ δ)) a2b(β) =
elim(α, a2b(κ) a2b(δ)) a2b(β) =
s elim(α, a2b(κ)) elim(α, a2b(δ)) a2b(β) ⟶
elim(α, a2b(κ)) a2b(β) (elim(α, a2b(δ)) a2b(β)) =
a2b(\α -> κ) a2b(β) (a2b(\α -> δ) a2b(β)) =
a2b((\α -> κ) β) a2b((\α -> δ) β) ⟶      -- induction hypothesis
a2b(κ[β/α]) a2b(δ[β/α]) =
a2b(κ[β/α] δ[β/α])
```

### Recudction in Strategy B implies reduction in Strategy A

Structural induction on rewrite rules:

``` Haskell
Case: u α ⟶ α s k

b2a(u α)   = (\x -> x b2a(s) b2a(k)) b2a(α)
             ⟶
b2a(α s k) = b2a(α) b2a(s) b2a(k))


Case: k α β ⟶ α

b2a(k α β) = (\a -> \b -> a) b2a(α) b2a(β)
             ⟶
             b2a(α)


Case: s α β γ ⟶ α γ (β γ)

b2a(s α β γ)   = (\a -> \b -> \c -> a c (b c)) b2a(α) b2a(β) b2a(γ)
                 ⟶
b2a(α γ (β γ)) = b2a(α) b2a(γ) (b2a(β) b2a(γ))


```

## Lambada is Turing Complete

One can recover combinators S, K and I as follows:
``` Haskell
let i = u u in
let k = u (u i) in
let s = u k in
...
```
Further common combinators as follows:
``` Haskell
let b = s (k s) k in
let c = s (b b s) (k k) in
let m = s i i in
let y = b m (c b m) in
...
```

###

##

# Derived properties of Lambada

- Build SKI => turing completeness
- Build lambda-calculus
- ADTs
- One can observe any ADTs

```
tt = \a \b a
ff = \a \b b
tt 🟢 🔴 = 🟢
ff 🟢 🔴 = 🔴
tt 🟩 🟥 = 🟩
ff 🟩 🟥 = 🟥

55357 56628 🔴
55357 56629 🔵
55357 57312 🟠
55357 57313 🟡
55357 57314 🟢
55357 57315 🟣
55357 57316 🟤

55357 57317 🟥
55357 57318 🟦
55357 57319 🟧
55357 57320 🟨
55357 57321 🟩
55357 57322 🟪
55357 57323 🟫

55357 56630 🔶
55357 56631 🔷
55357 56632 🔸
55357 56633 🔹
55357 56634 🔺
55357 56635 🔻
55357 57041 🛑

12295 〇
9675 ○
9679 ●
9711 ◯
9633 □
9632 ■
9671 ◇
9670 ◆
9651 △
9650 ▲
9661 ▽
9660 ▼
9734 ☆
9651 ★
```
