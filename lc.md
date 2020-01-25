# Lambada

A turing complete language based solely on minimalism.

## Abstract Syntax

Lambada's only syntactic category is "expressions" `Expr`, defined as follows:

```
Expr ::= 'u'            # "Iota"
       | Expr Expr      # "Application"
```

> Possible extensions: non-determinism

We write expressions using parentheses where necessary (assuming left-associativity).
For example, `u u (u u)` corresponds to the following AST:
```
    /\
   /  \
  /    \
 /\    /\
u  u  u  u
```

## Abstract Semantics

An expressions may be *reducible* into another expression, otherwise (if irreduible) we also call it a *value*.
We give several equivalent definitions of expression reduction below.
Expressions are *equal* (`=`) exactly if they reduce to the same value or reduction does not terminate for either expression.

### Observability

Reduction alone does not give *meaning* to expressions, especially since the language at its core is free of side-effect that one could observe.
Instead we give meaning to an expression by observing how it *acts* on parameters, i.e. expressions it is applied to.
For instance, if booleans `true` and `false` are defined as expressions such that
```
true  α β = α
false α β = β
```
holds for all expressions `α` and `β`, then we may identify them through exactly this property.
`true` and `false` may otherwise be treated as black boxes, i.e. which parameter they "select" shall be their only distinguishing feature.

Generally, given an expression `■` and arity `n`, an implementation must be able to compute `⟦■⟧ₙ`, which is the `i` such that
```
∀ α₀, ..., αₙ :  ■ α₀ ... αₙ = αᵢ
```
It may assume *that* `i` exists, i.e. that only valid queries are made and `⟦■⟧ₙ` is defined.
Examples:
```
⟦true⟧₂ = 0
⟦false⟧₂ = 1
```

This limited form of observability gives implementations *maximal* freedom in both representing expressions internally and realizing reduction.
It is up to implementations how to find `⟦■⟧ₙ`, but the following observations help:
- asd

### Reduction

We give two equivalent variants of defining expression reduction, either of which may be useful reference points for implementations.

#### Variant A - via Lambda Calculus

Translate expressons to (untyped) lambda calculus terms such that
- Iota `u` becomes `\x -> x (\a -> \b -> \c -> a c (b c)) (\a -> \b -> a)`
- Application becomes function application

Reduction means finding the WHNF of the lambda calculus term through beta-reduction (no eta-reduction).

Computing `⟦■⟧ₙ` (observability) could be achieved by applying `■` to `n` special values. The resulting WHNF will be one of these values. Note that since we may assume that `⟦■⟧ₙ` is defined, these special values will never end up as the "head" (function part) of a function application.

#### Variant B - via Term Rewriting

Extend `Expr` with two new abstract expressions `s` and `k`.
Apply the following rewrite rules to `Expr` as long as possible.

```
u α = α s k
k α β = α
s α β γ = α γ (β γ)
```

Computing `⟦■⟧ₙ` (observability) could be achieved by applying `■` to `n` special expressions. Since we may assume that `⟦■⟧ₙ`, we can expect exactly one of these special expressions to remain once no more rewrite rules apply.


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
