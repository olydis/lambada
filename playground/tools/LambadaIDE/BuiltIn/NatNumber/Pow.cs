using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Pow : BuiltInExpression
    {
        public static readonly Node Instance = new Pow().AsNode();

        private Pow() { }

        public override Node Call(Node argument)
        {
            return new Pow1(argument).AsNode();
        }
    }
    class Pow1 : BuiltInExpression
    {
        Node operand;

        public Pow1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            uint a = NatNumber.ValueOfNode(operand);
            uint b = NatNumber.ValueOfNode(argument);

            uint num = 1;
            while (b-- != 0)
                num *= a;

            return NatNumber.Get(num);
        }
    }
}
