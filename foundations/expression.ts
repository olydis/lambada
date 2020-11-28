export type Expression<TLeaf> = { readonly type: 'application', readonly a: Expression<TLeaf>, readonly b: Expression<TLeaf> } | { readonly type: 'leaf', readonly value: TLeaf };

export function toDOT<TLeaf>(expression: Expression<TLeaf>, sharing: boolean): string {
  if (!sharing) expression = JSON.parse(JSON.stringify(expression));

  const nodes = new Map<Expression<TLeaf>, { id: number, depth: number }>();

  {
    let id = 0;
    const visit = (expression: Expression<TLeaf>) => {
      if (!nodes.has(expression)) {
        let depth = 0;
        switch (expression.type) {
          case "application":
            depth = Math.max(depth, visit(expression.a));
            depth = Math.max(depth, visit(expression.b));
            depth++;
            break;
          case "leaf":
            break;
        }
        nodes.set(expression, { id, depth });
        id++;
      }
      return nodes.get(expression)!.depth;
    };
    visit(expression);
  }

  const dot: string[] = [];
  for (const [expression, node] of nodes.entries()) {
    let label;
    let shape;
    let size;
    switch (expression.type) {
      case "application":
        label = '';
        shape = 'point';
        size = 0.1;
        break;
      case "leaf":
        label = expression.value;
        shape = 'circle';
        size = 1;
        break;
    }
    dot.push(`${node.id} [label=${JSON.stringify(label)}, shape=${shape}, width=${size}, height=${size}]`);
  }
  for (const [expression, node] of nodes.entries()) {
    switch (expression.type) {
      case "application":
        dot.push(`${node.id} -> ${nodes.get(expression.a)!.id}`);
        dot.push(`${node.id} -> ${nodes.get(expression.b)!.id} [color=grey, style=dashed]`);
        break;
      case "leaf":
        break;
    }
  }

  return `digraph G {\nedge [arrowhead=vee]\n${dot.join('\n')}\n}`;
}


type E = Expression<string>;
const u: E = { type: 'leaf', value: 'u' };

// const i: E = { type: 'application', a: u, b: u };
// const k: E = { type: 'application', a: u, b: { type: 'application', a: u, b: i } };
// const s: E = { type: 'application', a: u, b: k };
// const b: E = { type: 'application', a: { type: 'application', a: s, b: { type: 'application', a: k, b: s } }, b: k };
// const c: E = { type: 'application', a: { type: 'application', a: s, b: { type: 'application', a: { type: 'application', a: s, b: { type: 'application', a: k, b: s } }, b: { type: 'application', a: { type: 'application', a: s, b: { type: 'application', a: k, b: k } }, b: s } } }, b: { type: 'application', a: k, b: k } };

const i: E = { type: 'leaf', value: 'i' };
const k: E = { type: 'leaf', value: 'k' };
const s: E = { type: 'leaf', value: 's' };
const b: E = { type: 'leaf', value: 'b' };
const c: E = { type: 'leaf', value: 'c' };

const m: E = { type: 'application', a: { type: 'application', a: s, b: i }, b: i };
const y: E = { type: 'application', a: { type: 'application', a: b, b: m }, b: { type: 'application', a: { type: 'application', a: c, b: b }, b: m } };

console.log(toDOT(y, true));
