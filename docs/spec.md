# Lambada

Lambada is:
- A turing complete language free of side-effects.
- Minimalistic in terms of syntax and semantics.
- Designed to ease implementation and formal reasoning.
- Not designed for human readability, however it is easy to compile down high level constructs.


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

An expressions may be *reducible* to another expression, otherwise (if irreduible) we also call it a *value*.
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
Apply the following rewrite rules as long as possible.

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

Generally, given an expression `■`, we define `⟦■⟧` as
``` Haskell
⟦■⟧ = argmin n
    (n, i, a) ∈ S

where S = { (n, i, a) ∈ ℕ × ℕ₀ × ℕ₀
          | ∀ α₀, ..., αₙ :
            ∃ β₁, ..., βₐ :
            ■ α₀ ... αₙ = αᵢ β₁ ... βₐ }
```
In other words, `⟦■⟧` determines which argument (index `i`) ends up in head position with `a` arguments after applying at least `n` arguments.
Note that `i` is fixed for given `■` and does not depend on `n`:
More parameters will not be consumed and end up as parameters of `αᵢ`, increasing `a`.
Therefore `argmin` only minimizes `n`.
An implementation may assume that it is only asked to compute `⟦■⟧` if it is defined.
For instance, it is acceptable for an imlplementation to not terminate if `⟦■⟧` is undefined.
Examples:
``` Haskell
⟦true⟧  = (2, 0, 0)
⟦false⟧ = (2, 1, 0)
⟦u⟧ = (1, 0, 2)
⟦u u⟧ = (1, 0, 0)
```

## Concrete Syntax

The notation introduced earlier (example: `u u (u u u)`) is an obvious candidate of a human-readable syntax of expressions.
However, it is not very succinct since multiple copies of identical subexpressions need to be written out.
To prevent this, we extend this notation with a "let" syntax that allows binding names to expressions, like in Haskell or OCaml.
In case of name collisions, inner definitions hide outer ones.
The example expression could be written as
``` Haskell
let i = u u in
i (i u)
```

We will use this notation from now on.


However, since Lambada is aimed towards ease of implementation, simplicity and minimalism, this will not be our concrete syntax (which will need to be consumed by an implementation).
Parsing the notation would require a somewhat sophisticated tokenizer, raises subtle questions about legality of names (are `let` and `in` allowed?) and requires a parser and grammar that is not quite as trivial as we would like (e.g. due to parentheses).

Instead, we linearize the notation (allowing for a parser with minimal state) and allow any *non-empty* sequences of *non-whitespace* Unicode characters as names.
The only predefined name is "u", which represents expression `u`.

### Grammar

``` Haskell
Terminator ::= ' '          -- space   0x20
Define ::= '\n'             -- newline 0x0A
Name ::= \S+
Expression ::= Name Terminator
             | Expression Expression Terminator
             | Expression Name Define Expression
```

The example expression then becomes:
```
u u  i
i i u
```
Note the trailing whitespace in the second line, which however can be inferred to have length three given that `u`, `i u` and the entire expression need to be terminated.

### Unparsing

We'll use our notation to represent ASTs.
If one truly has a plain AST (i.e. with no aliases for subexpressions) as input, one can assign arbitrary aliases to subexpressions that appear in the expression multiple times.
We use `+` for string concatenation in the following definition.

``` Haskell
unparse(name) = name + ' '
unparse(expr expr) = unparse(expr) + unparse(expr) + ' '
unparse(let n = e in expr) = unparse(e) unparse(n) + '\n' + unparse(expr)
```

### Parsing

Parsing into an AST can be implemented using a stack of expressions as well as a stack of mappings from names to expressions.
The latter is required (rather than being a single mapping) since let bindings are scoped.
The stack of expressions starts out empty, the stack of mappings starts out mapping "u" to expression `u`.

The parser can now greedily consume tokens and react as follows:
- Name Terminator: Lookup the name using the current mapping (top of stack). Push the resulting expression onto the stack of expressions and push the current mapping onto the stack of mappings (i.e. duplicate).
- Terminator: Pop the two top-most expressions from the stack of expressions and push back their application. Also pop one element off the stack of mappings.
- Name Define: Pop one element off the stack of mappings. Pop one element off the stack of expressions, and update the current mapping (top of stack) to *also* map the name (just consumed) to the expression (just popped off).

For a valid stream of tokens, all name lookups will succeed and after consuming all tokens, the stack of expressions will contain exactly one expression.
This expression is the result.
