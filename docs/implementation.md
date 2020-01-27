# Implementation Hints

In this section we summarize observations about the system defined above.

## Implementing `⟦ ⟧`

- Due to the universal quantification in the definition of `⟦■⟧`, the specifics of parameter expressions cannot matter.
- Note also that due to the reduction rules, expressions cannot be "introspected" without apearing in head position; at which point `⟦■⟧` can terminate.
- It is hence possible to instead use as arguments atomic dummy expressions/tokens that are outside of the abstract syntax defined here.
- These should be unaffected by the reduction process, until one ends up in head position, i.e. as the left-most leaf.

## Reduction

### Sharing

- Structurally identical expressions will have the same reduction behavior, i.e. are also observably identical (referential transparency).
- It is hence valid to let structurally identical expressions *share* the same internal represenation, effectively reducing them simultaneously.

### WHNF

- Regardless of strategy, reduction can lead to expressions being discarded or duplicated.
- In the former case, it would have been a waste to perform reduction on the discarded expression. In the latter case, no additional work is induced thanks to sharing.
- Therefore, the most efficient reduction strategy is to always reduce expressions that are in head position (rather than expressions in "argument position").
