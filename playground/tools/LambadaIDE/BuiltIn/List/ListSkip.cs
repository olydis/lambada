using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class ListSkip : BuiltInExpression
    {
        public static readonly Node Instance = new ListSkip().AsNode();

        private ListSkip() { }

        public override Node Call(Node argument)
        {
            return new ListSkip1(argument).AsNode();
        }
    }
    class ListSkip1 : BuiltInExpression
    {
        Node operand;

        public ListSkip1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return new List(List.ValueOfNode(operand).Skip((int)NatNumber.ValueOfNode(argument))).AsNode();
        }
    }
}
