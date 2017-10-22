---
layout: page
title: Documentation
header: LambAda Documentation
group: navigation
published: true
---

{% include JB/setup %}

## Summary

LambAda is a very minimal programming language, based on lambda-calculus and combinatory logic.
Both syntax (using [flavors](#flavors)) and semantics (using runtimes) are freely extensible, though.
It acts like an ultimate language

LambAda is driven by the following design principles.

## Design Principles
- **Precision**
  - LambAda's formal semantics leave no room for interpretation.
  - Programs are treated very mathematically, there is no built-in notion of IO, time or other extrinsic components. 
  - Embedding programs into runtimes gives them further practical meaning.
- **Minimalism**
  - LambAda's abstract syntax boils down to a single composition rule: `Expression ::= Expression Expression` (i.e. application).
  - Nothing is taken for granted. You may treat pen and paper as a legitimate LambAda runtime (optionally with a brain controlling the pen).
  - Building a working runtime (interpreting programs as Mogensen–Scott encoded strings) takes less than 1h, optimizing it to sane performance takes less than 1 day (see [Implementation](implementation.html)).
  - No type system is imposed by the specification. In practice, both programmers and runtimes are enabled to introduce type systems themselves (see [Typing](#typing)).
  - LambAda's native syntax contains no syntactic sugar. It is designed to enable *efficient processing* rather than human readability. In a sense it is just a serialization scheme.
- **Bootstrapping**
  - Compilation can be performed by a running LambAda instance.
  - Heavy lifting and type systems are expressible in the language itself, so runtimes can be entirely ignorant about it (see [Flavors](#flavors)). On the other hand, being aware of higher level constructs might benefit performance.
  - Once you have a new language feature defined, you may of course use it to rewrite the definitions leading to the feature in the first place.
- **Flexibility**
  - It is easy to define your own parsers/front-ends. You are free to write a parser for Haskell or C, as long as a LambAda AST is the result.
  - The language itself does not distinct compile time and runtime (due to referential transparency). This allows runtime code generation, JIT compilation or any other form of bending the boundaries between executable and source code.  
  - Runtimes are free to provide optimizations for features the environment provides special support for. LambAda running on a CPU will run significantly faster if the runtime makes use of integer arithmetic (mapping data types and functions to "built-in" features). Obviously, proving the preservation of semantics is crucial (see [Cheating](#cheating)).

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
TODO