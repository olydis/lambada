# Lambada

## Abstract Syntax

```
Expr ::= 'u'            # "Iota"
       | Expr Expr      # "Application"
```

> Possible extensions: non-determinism

## Abstract Semantics

An expression is assigned meaning through the *value* it *reduces to*.
We want to leave the details of this reduction process to implementations so we expect no ability to reflect on intermediate results.


Specifically, we do not expect the ability to *reflect* on expressions (to retrieve their abstract syntax in any form), beyond what is possible by

> What about non-termination? Decidability?



reduced to *values*

```
Atom ::= arbitrary set
Expr ::= 'u'
       | Expr Expr
       | Atom
```

### Variant A

> Here, observability should correspond to WHNF spitting out an atom

Translate expressons to (untyped) lambda calculus terms such that
- Iota `u` becomes `\x -> x (\a -> \b -> \c -> a c (b c)) (\a -> \b -> a)`
- Application becomes function application
- Atoms remain atomic

> ^ can we say `<Atom> ...` is undefined as in "doesn't matter" or as in "stop"?

Reduction means finding WHNF of the lambda calculus term.


### Variant B

>


```
tt = \a \b a
ff = \a \b b
tt 🟢 🔴 = 🟢
ff 🟢 🔴 = 🔴
tt 🟩 🟥 = 🟩
ff 🟩 🟥 = 🟥
```

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
