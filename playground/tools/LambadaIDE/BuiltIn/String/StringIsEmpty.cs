using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StringIsEmpty : BuiltInExpression
    {
        public static readonly Node Instance = new StringIsEmpty().AsNode();

        private StringIsEmpty() { }

        public override Node Call(Node argument)
        {
            return Bool.GetBool(StringX.ValueOfNode(argument).Length == 0);
        }
    }
}
