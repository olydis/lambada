using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class ListHead : BuiltInExpression
    {
        public static readonly Node Instance = new ListHead().AsNode();

        private ListHead() { }

        public override Node Call(Node argument)
        {
            return List.ValueOfNode(argument).First();
        }
    }
}
