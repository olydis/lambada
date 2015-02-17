using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StringTail : BuiltInExpression
    {
        public static readonly Node Instance = new StringTail().AsNode();

        private StringTail() { }

        public override Node Call(Node argument)
        {
            return StringX.FromString(StringX.ValueOfNode(argument).Substring(1));
        }
    }
}
