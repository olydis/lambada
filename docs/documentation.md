---
layout: page
title: Documentation
header: LambAda Documentation
group: navigation
published: true
---

{% include JB/setup %}

## Foundation

LambAda is a very minimal programming language, bootstrapped entirely from the [Iota combinator](https://en.wikipedia.org/wiki/Iota_and_Jot).
A (minimal) runtime hence only needs to know the semantics of the Iota combinator (abbreviated as `u` going forward) and reduce expressions of the abstract syntax `expr :== 'u' | expr expr`.
Programs can be thought of as binary DAGs, with `u` at all leaves (DAGs instead of trees, since subexpression *sharing* is crucial for efficient runtimes).


## Extension to a Haskell-like language

For the sake of this playground and demonstrating the computational power and extensibility of these tiny foundations, LambAda is extended to a more usable language with features similar to Haskell.
This language is fully compiled down into said abstract syntax of binary DAGs, and this compiler is also written in LambAda; so truly no infrastructure is needed beyond a Iota reduction machine.

So while the core language only knows combinator `u`, the following things were added:
- Definitions `<name> '=' <expr>`, i.e. named expressions, where `<name>` must start with a lower-case character. This enables expressing DAGs textually and can be thought of as the minimal *concrete* syntax for the mentioned abstract syntax. Expressions may only reference names defined prior to the current definition *and* the name being currently defined (but no names defined later).
- Common combinators like `s`, `k`, `i`, `b`, `c` and `y` (see https://en.wikipedia.org/wiki/Combinatory_logic).
- Lambdas, which are translated via the common combinators mentioned above. Syntax is minimal: `'\'<name> <expr>`, so no arrow. Example: `\a \b a` would be a valid (re-)definition of the `k` combinator.
- [Scott encoded](https://crypto.stanford.edu/~blynn/compiler/scott.html) [algebraic data types](https://en.wikipedia.org/wiki/Algebraic_data_type) with syntax `<Name> '=' <Ctor> ('|' <Ctor>)*`, where `<Name>` must start with an upper-case letter and `<Ctor> :== <Name> (<field>)*`. Since there are no real static or runtime types (yet), what you write for `<field>`s does not matter. All that matters is arity of constructors.
- Predefined AGTs: `Bool`, `Nat`, `Pair`, `List`, `Maybe`, ... and *many* library functions related to them.
- Special syntax:
  - decimals like `123` turn into a corresponding `Nat`
  - `"`-delimited strings turn into a `List` of `Nat`s
  - `[]`-delimited lists of expressions, seperated by `,`, become a `List`
  - `$` for infix application, as in Haskell

## Design Principles
- **Precision**
  - LambAda's formal semantics leave no room for interpretation.
  - Programs can be reasoned about mathematically, there is no built-in notion of IO, time or other extrinsic components. One can think of `u` as the "ability to compute". Concepts that are so orthogonal to `u` that they can't be expressed in terms of it may deserve their own built-in combinator with its own semantics.
  - Behavior of programs can be observed by placing them into runtimes and probing results of reduction. For instance, a program known to have type `Bool` can be evaluated by destructing the expected Scott-encoding using dummy values: Reducing `<mysterious program> <dummy1> <dummy2>` will result in either dummy depending on the boolean value.
- **Minimalism**
  - LambAda's abstract syntax is tiny.
  - Building a working runtime takes less than 1h, optimizing it to sane performance takes less than 1 day (see [Implementation](implementation.html)).
  - No type system is imposed by the specification. In practice, both programmers and runtimes are enabled to introduce type systems themselves (see [Typing](#typing)).
  - LambAda's native syntax has no syntactic sugar. It is designed to enable *efficient unambiguous processing* rather than human readability. In a sense it is just a serialization scheme for computation.
- **Bootstrapping**
  - Compilation can be performed by a running LambAda instance.
  - Heavy lifting and type systems are expressible in the language itself, so runtimes can be entirely ignorant about it (see [Flavors](#flavors)). On the other hand, being aware of higher level constructs might benefit performance.
  - Once you have a new language feature defined, you may use it to rewrite the definitions leading to the feature in the first place. The part of the compiler that de-sugars lambdas will likely use lambdas heavily.
- **Flexibility**
  - With concise foundations at hand, you are free to write a parser desugaring high-level languages into LambAda constructs.
  - The language itself does not impose a distinction between compile time and runtime (referential transparency and such). This allows runtime code generation, JIT compilation or any other form of bending the boundaries between executable and source code.
  - Runtimes are free to provide optimizations for features the environment provides special support for. The JavaScript runtime of this playground runs significantly faster than reducing just `u` combinators thanks to tagging: Known combinators (in theory one could assert them to represent specific DAGs) are tagged with built-in values of the runtime, for instance lists can be tagged with corresponding JavaScript lists, functions operating on lists with their native equivalent, and so on. Obviously, proving the preservation of semantics is crucial (see [Cheating](#cheating)).
<!--
## Specification

### Abstract syntax
`Expression ::= Expression Expression | ⊤`

The resulting AST is therefore a binary tree with ⊤ as its leaves.

### Notation
An AST is likely to contain lots of identical subtrees.
To leverage this redundancy edges pointing to identical copies of a subtree may instead point to one and the same instance of this subtree.
This effectively allows to compress the AST, resulting in a DAG (with a single source-node).

A depth-first traversal on such a DAG would restore the original AST.

TODO: textual DAG-representation

`⊥ := (\i -> (\s -> (\m -> m m) (s i i)) (⊤ (⊤ (⊤ i)))) (⊤ ⊤) = ⊤ (⊤ (⊤ (⊤ ⊤))) (⊤ ⊤) (⊤ ⊤) (⊤ (⊤ (⊤ (⊤ ⊤))) (⊤ ⊤) (⊤ ⊤))`

### Semantics
TODO: use denotational semantics of lecture?

### Syntax
TODO: describe DAG serialization scheme

## Flavors
Flavors are front-ends to the LambAda core language.
Typical aspects of a flavor are an intuitive syntax, a type system, built-in types and other higher order constructs.

Formally, any way of transforming data (text, graphs, ...) into LambAda-ASTs can be considered a flavor.

### Haskell
The entire LambAda-prelude (including this very flavor) is currently implemented using this flavor.
This is possible due to bootstrapping, i.e. you require a native LambAda-prelude to compile the Haskell-ish prelude to a native one.

#### Tokens
    LowerCaseLetter := a..z_
    UpperCaseLetter := A..Z
    Number          := 0..9
    Letter          := A..Za..z_
    AlphaNum        := 0..9A..Za..z_
    Quot            := `"

    T_CHAR_ASSIGN   =
    T_CHAR_ABSRACT  \
    T_CHAR_COMMA    ,
    T_CHAR_OR       |
    T_CHAR_DOLLAR   $
    T_CHAR_PAO      (
    T_CHAR_PAC      )
    T_CHAR_SQO      [
    T_CHAR_SQC      ]
    T_LIT_LOWER   :=  LowerCaseLetter AlphaNum*
    T_LIT_UPPER   :=  UpperCaseLetter AlphaNum*
    T_CONST_S     :=  Quot ... Quot
    T_CONST_N     :=  Number*
    T_COMMENT     :=  ' ...

#### Syntax
{% highlight haskell %}

Program     = Statement*
Statement   = [Assignment | Expression] [<T_COMMENT>]
Assignment  = <T_LIT_LOWER> <T_CHAR_ASSIGN> Expression
Expression  = <T_LIT_LOWER> | <T_LIT_UPPER>
            | <T_CONST_S>   | <T_CONST_N>
            | List
            | Application
            | Abstraction
            | TypeDef
List        = <T_CHAR_SQO> [Expression (<T_CHAR_COMMA> Expression)*] <T_CHAR_SQC>
Application = Expression Expression
            | <T_CHAR_PAO> Expression <T_CHAR_PAC>
            | Expression <T_CHAR_DOLLAR> Expression
Abstraction = <T_CHAR_ABSRACT> <T_LIT_LOWER> Expression
TypeDef     = <T_LIT_UPPER> <T_CHAR_ASSIGN> TypeAlt (<T_CHAR_OR> TypeAlt)*
TypeAlt     = <T_LIT_UPPER> <T_LIT_LOWER>

{% endhighlight %}

## Performance

### Cheating
TODO

### Comparison to physics
TODO -->
