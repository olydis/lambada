using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Fst : BuiltInExpression
    {
        public static readonly Node Instance = new Fst().AsNode();

        private Fst() { }

        public override Node Call(Node argument)
        {
            return Pair.GetFirst(argument);
        }
    }
}
