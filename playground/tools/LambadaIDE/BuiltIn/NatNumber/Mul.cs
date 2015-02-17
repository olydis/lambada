using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Mul : BuiltInExpression
    {
        public static readonly Node Instance = new Mul().AsNode();

        private Mul() { }

        public override Node Call(Node argument)
        {
            return new Mul1(argument).AsNode();
        }
    }
    class Mul1 : BuiltInExpression
    {
        Node operand;

        public Mul1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return NatNumber.Get(NatNumber.ValueOfNode(operand) * NatNumber.ValueOfNode(argument));
        }
    }
}
