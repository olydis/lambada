using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Snd : BuiltInExpression
    {
        public static readonly Node Instance = new Snd().AsNode();

        private Snd() { }

        public override Node Call(Node argument)
        {
            return Pair.GetSecond(argument);
        }
    }
}
