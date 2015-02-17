using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StringSkip : BuiltInExpression
    {
        public static readonly Node Instance = new StringSkip().AsNode();

        private StringSkip() { }

        public override Node Call(Node argument)
        {
            return new StringSkip1(argument).AsNode();
        }
    }
    class StringSkip1 : BuiltInExpression
    {
        Node operand;

        public StringSkip1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return StringX.FromString(StringX.ValueOfNode(operand).Substring((int)NatNumber.ValueOfNode(argument)));
        }
    }
}
