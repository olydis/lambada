using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Pred : BuiltInExpression
    {
        public static readonly Node Instance = new Pred().AsNode();

        private Pred() { }

        public override Node Call(Node argument)
        {
            uint x = NatNumber.ValueOfNode(argument);
            return NatNumber.Get(x == 0 ? 0 : (x - 1));
        }
    }
}
