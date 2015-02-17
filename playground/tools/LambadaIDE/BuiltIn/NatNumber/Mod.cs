using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Mod : BuiltInExpression
    {
        public static readonly Node Instance = new Mod().AsNode();

        private Mod() { }

        public override Node Call(Node argument)
        {
            return new Mod1(argument).AsNode();
        }
    }
    class Mod1 : BuiltInExpression
    {
        Node operand;

        public Mod1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            uint a = NatNumber.ValueOfNode(operand);
            uint b = NatNumber.ValueOfNode(argument);

            return NatNumber.Get(a % b);
        }
    }
}
