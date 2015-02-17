using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Div : BuiltInExpression
    {
        public static readonly Node Instance = new Div().AsNode();

        private Div() { }

        public override Node Call(Node argument)
        {
            return new Div1(argument).AsNode();
        }
    }
    class Div1 : BuiltInExpression
    {
        Node operand;

        public Div1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            uint a = NatNumber.ValueOfNode(operand);
            uint b = NatNumber.ValueOfNode(argument);

            return NatNumber.Get(a / b);
        }
    }
}
