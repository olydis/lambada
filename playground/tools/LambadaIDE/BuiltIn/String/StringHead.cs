using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StringHead : BuiltInExpression
    {
        public static readonly Node Instance = new StringHead().AsNode();

        private StringHead() { }

        public override Node Call(Node argument)
        {
            return NatNumber.Get(StringX.ValueOfNode(argument)[0]);
        }
    }
}
