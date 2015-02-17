using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Succ : BuiltInExpression
    {
        public static readonly Node Instance = new Succ().AsNode();

        private Succ() { }

        public override Node Call(Node argument)
        {
            return NatNumber.Get(NatNumber.ValueOfNode(argument) + 1);
        }
    }
}
