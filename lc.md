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
It is up to implementations how to find `⟦■⟧ₙ`, but the following observation may help:
- Recall that an implementation may assume that `⟦■⟧ₙ` it is supposed to answer is defined.
- So the parameter selection property of `■` holds for *all* possible parameter expressions, so the specifics of these expressions cannot matter.
- It should hence be possible to instead use `n` atomic dummy expressions/tokens that are outside of the defined abstract syntax.
- These should be largely "unaffected" by the reduction process, which will terminate with one of them remaining.

### Reduction

We give two equivalent strategies of defining expression reduction, either of which may be useful reference points for implementations.

#### Strategy A - via Lambda Calculus

Translate expressons to (untyped) lambda calculus terms such that
- Iota `u` becomes `\x -> x (\a -> \b -> \c -> a c (b c)) (\a -> \b -> a)`
- Application becomes function application

Reduction means finding the WHNF of the lambda calculus term through beta-reduction (no eta-reduction).
Note that this translation and hence also reduction will only ever produce closed terms.

Computing `⟦■⟧ₙ` (observability) could be achieved by applying `■` to `n` special values. The resulting WHNF will be one of these values. Note that since we may assume that `⟦■⟧ₙ` is defined, these special values will never end up as the "head" (function part) of a function application.

#### Strategy B - via Term Rewriting

Extend `Expr` with two new abstract expressions `s` and `k`.
Apply the following rewrite rules to `Expr` as long as possible.

```
u α     ⟶ α s k
k α β   ⟶ α
s α β γ ⟶ α γ (β γ)
```

Computing `⟦■⟧ₙ` (observability) could be achieved by applying `■` to `n` special expressions. Since we may assume that `⟦■⟧ₙ`, we can expect exactly one of these special expressions to remain once no more rewrite rules apply.

#### Strategies A and B are equivalent

We give a translation scheme between terms of both strategies and show that a reduction in either strategy implies an equivalent reduction in the other strategy.

##### Translation of Strategy A terms to Strategy B terms

Assume that the following cases are matched top to bottom.
Intermediate terms of the translation are `Expr`, but with variables `α` from lambda terms, before they are eliminated.
To distinguish them from `u`, `k` and `s` we will embed writing `<α>`.

```
elim(α, β) = k β   if β does not contain <α>
elim(α, <α>) = u u
elim(α, β γ) = s elim(α, β) elim(α, γ)

a2b(α β) = a2b(α) a2b(β)
a2b(\α -> β) = elim(α, a2b(β))
a2b(α) = <α>
```

Since lambda terms occuring in Strategy A are closed, no embedded variables `<α>` remain.

##### Translation of Strategy B terms to Strategy A terms

```
b2a(u) = \x -> x b2a(s) b2a(k)
b2a(k) = \a -> \b -> a
b2a(s) = \a -> \b -> \c -> a c (b c)
b2a(α β) = b2a(α) b2a(β)
```

##### Recudction in Strategy A implies reduction in Strategy B

Structural induction on beta-reduction `(\α -> γ) β ⟶ γ[β/α]`:

```
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
a2b((\α -> κ) β) a2b((\α -> δ) β) ⟶      // induction hypothesis
a2b(κ[β/α]) a2b(δ[β/α]) =
a2b(κ[β/α] δ[β/α])
```

##### Recudction in Strategy B implies reduction in Strategy A

Structural induction on rewrite rules:

```
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
