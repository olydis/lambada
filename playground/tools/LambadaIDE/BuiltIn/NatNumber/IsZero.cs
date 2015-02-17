using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class IsZero : BuiltInExpression
    {
        public static readonly Node Instance = new IsZero().AsNode();

        private IsZero() { }

        public override Node Call(Node argument)
        {
            return Bool.GetBool(NatNumber.ValueOfNode(argument) == 0);
        }
    }
}
