using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Xor : BuiltInExpression
    {
        public static readonly Node Instance = new Xor().AsNode();

        private Xor() { }

        public override Node Call(Node argument)
        {
            return new Xor1(argument).AsNode();
        }
    }
    class Xor1 : BuiltInExpression
    {
        Node operand;

        public Xor1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            uint a = NatNumber.ValueOfNode(operand);
            uint b = NatNumber.ValueOfNode(argument);

            return NatNumber.Get(a ^ b);
        }
    }
}
