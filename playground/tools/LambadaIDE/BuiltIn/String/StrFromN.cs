using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StrFromN : BuiltInExpression
    {
        public static readonly Node Instance = new StrFromN().AsNode();

        private StrFromN() { }

        public override Node Call(Node argument)
        {
            return StringX.FromString(NatNumber.ValueOfNode(argument).ToString());
        }
    }
}
