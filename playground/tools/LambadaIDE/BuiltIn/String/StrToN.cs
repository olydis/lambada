using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StrToN : BuiltInExpression
    {
        public static readonly Node Instance = new StrToN().AsNode();

        private StrToN() { }

        public override Node Call(Node argument)
        {
            return NatNumber.Get(uint.Parse(StringX.ValueOfNode(argument)));
        }
    }
}
