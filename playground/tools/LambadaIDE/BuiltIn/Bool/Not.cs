using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Not : BuiltInExpression
    {
        public static readonly Node Instance = new Not().AsNode();

        private Not() { }

        public override Node Call(Node argument)
        {
            return Bool.GetBool(!Bool.ValueOfNode(argument));
        }
    }
}
