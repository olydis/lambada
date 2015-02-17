using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class ListTail : BuiltInExpression
    {
        public static readonly Node Instance = new ListTail().AsNode();

        private ListTail() { }

        public override Node Call(Node argument)
        {
            return new List(List.ValueOfNode(argument).Skip(1)).AsNode();
        }
    }
}
