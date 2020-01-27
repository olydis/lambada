# Lambada

## Abstract Syntax

``` Haskell
Expr ::= 'u' | Expr Expr
```

We write expressions using parentheses where necessary (assuming left-associativity), for example `u u (u u u)`.

## Abstract Semantics

An expressions may be *reducible* to another expression, otherwise (if irreduible) we also call it a *value*.
Expressions are *equal* (`=`) exactly if they reduce to the same value or reduction does not terminate for either expression.

### Reduction

We give two equivalent strategies of defining expression reduction.

#### Strategy A - via Lambda Calculus

Translate expressons to (untyped) lambda calculus terms such that
- Iota `u` becomes `\x -> x (\a -> \b -> \c -> a c (b c)) (\a -> \b -> a)`
- Application becomes function application

Reduction means finding the WHNF of the lambda calculus term through beta-reduction (no eta-reduction).

#### Strategy B - via Term Rewriting

Extend `Expr` with two new abstract expressions `s` and `k`.
Apply the following rewrite rules as long as possible.

``` Haskell
u α     ⟶ α s k
k α β   ⟶ α
s α β γ ⟶ α γ (β γ)
```

### Observability

Given an expression `■`, we define `⟦■⟧` as
``` Haskell
⟦■⟧ = argmin n
   (n, i, a) ∈ S

where S = { (n, i, a) ∈ ℕ × ℕ₀ × ℕ₀
          | ∀ α₀, ..., αₙ :
            ∃ β₁, ..., βₐ :
            ■ α₀ ... αₙ = αᵢ β₁ ... βₐ }
```
An implementation may assume that it is only asked to compute `⟦■⟧` if it is defined.

## Concrete Syntax

The notation used so far is not very succinct since multiple copies of identical subexpressions need to be written out.
We hence introduce a let binding syntax, like in Haskell or OCaml.
In case of name collisions, inner definitions hide outer ones.
The expression `u u (u u u)` could be written as `let i = u u in i (i u)`.

However, since Lambada is aimed towards ease of implementation, simplicity and minimalism, this will not be our concrete syntax.
Instead, we linearize the notation and allow any *non-empty* sequences of *non-whitespace* Unicode characters as names.
The only predefined (but not reserved!) name is "u", which represents expression `u`.

### Grammar

``` Haskell
Terminator ::= ' '          -- space   0x20
Define ::= '\n'             -- newline 0x10
Discard ::= [^\S \n]*       -- all other whitespace
Name ::= \S+
Expression ::= α:Name Terminator                       -- Case: α (name)
             | β:Expression γ:Expression Terminator    -- Case: β γ (application)
             | β:Expression α:Name Define γ:Expression -- Case: let α = β in γ
```
