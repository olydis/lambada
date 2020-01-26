# Lambada

A turing complete language based solely on minimalism.

## Abstract Syntax

Lambada's only syntactic category is "expressions" `Expr`, defined as follows:

``` Haskell
Expr ::= 'u'            -- "Iota"
       | Expr Expr      -- "Application"
```

We write expressions using parentheses where necessary (assuming left-associativity).
For example, `u u (u u u)` corresponds to the following AST:
```
    /\
   /  \
  /    \
 /\    /\
u  u  /\ u
     u  u
```

We say a subexpression of an expression is in *head position* if it is rooted along the left-most "spine" of the expression.
The above example has three subexpressions in head position:
- `u`, the left-most leaf
- `u u`, rooted at the parent of said leaf
- The entire expression

## Abstract Semantics

An expressions may be *reducible* into another expression, otherwise (if irreduible) we also call it a *value*.
We give several equivalent definitions of expression reduction below.
Expressions are *equal* (`=`) exactly if they reduce to the same value or reduction does not terminate for either expression.

Lambada does not require implementations to report the abstract syntax of an expression ("reflection").
We limit the degree of observability of expressions, giving implementations freedom in both representing expressions internally and realizing reduction.
We formalize expected observability after reduction.

### Reduction

We give two equivalent strategies of defining expression reduction, either of which may be useful reference points for implementations.

#### Strategy A - via Lambda Calculus

Translate expressons to (untyped) lambda calculus terms such that
- Iota `u` becomes `\x -> x (\a -> \b -> \c -> a c (b c)) (\a -> \b -> a)`
- Application becomes function application

Reduction means finding the WHNF of the lambda calculus term through beta-reduction (no eta-reduction).
Note that this translation and hence also reduction will only ever produce closed terms.

#### Strategy B - via Term Rewriting

Extend `Expr` with two new abstract expressions `s` and `k`.
Apply the following rewrite rules to `Expr` as long as possible.

``` Haskell
u α     ⟶ α s k
k α β   ⟶ α
s α β γ ⟶ α γ (β γ)
```

### Observability

Reduction alone does not give *meaning* to expressions, especially since the language at its core is free of side-effect that one could observe.
Instead we give meaning to an expression by observing how it *acts* on parameters, i.e. expressions it is applied to.
For instance, if booleans `true` and `false` are defined as expressions such that
``` Haskell
true  α β = α
false α β = β
```
holds for all expressions `α` and `β`, then we may identify them through exactly this property.
`true` and `false` may otherwise be treated as black boxes, i.e. which parameter they forward to head position shall be their only distinguishing feature.

Generally, given an expression `■`, an implementation must be able to compute
``` Haskell
⟦■⟧ = argmin n
    (i, n) ∈ S

where S = { (i, n) ∈ ℕ₀ × ℕ | ∀ α₀, ..., αₙ :  ■ α₀ ... αₙ = αᵢ ... }
```
In other words, `⟦■⟧` determines which argument (index `i`) ends up in head position after applying at least `n` arguments.
Note that `i` is fixed for given `■` and does not depend on `n` (more parameters will not be consumed and end up as parameters of `αᵢ`), so `argmin` only minimizes `n`.
If no such `i` and `n` exist, the imlplementation may not terminate, i.e. it is not the responsibility of an implementation to detect whether `⟦■⟧` is defined.
Examples:
``` Haskell
⟦true⟧  = (0, 2)
⟦false⟧ = (1, 2)
```

It is up to implementations how to find `⟦■⟧`, but the following observations may help:
- Due to the universal quantification in the definition of `⟦■⟧`, the specifics of parameter expressions cannot matter.
- Note also that due to the reduction rules, expressions cannot be "introspected" without apearing in head position; at which point `⟦■⟧` can terminate.
- It is hence possible to instead use as arguments atomic dummy expressions/tokens that are outside of the abstract syntax defined here.
- These should be unaffected by the reduction process, until one ends up in head position, i.e. as the left-most leaf.


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
