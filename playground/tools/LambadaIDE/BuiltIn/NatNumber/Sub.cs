using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Sub : BuiltInExpression
    {
        public static readonly Node Instance = new Sub().AsNode();

        private Sub() { }

        public override Node Call(Node argument)
        {
            return new Sub1(argument).AsNode();
        }
    }
    class Sub1 : BuiltInExpression
    {
        Node operand;

        public Sub1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            uint a = NatNumber.ValueOfNode(operand);
            uint b = NatNumber.ValueOfNode(argument);

            return NatNumber.Get(a < b ? 0 : a - b);
        }
    }
}
