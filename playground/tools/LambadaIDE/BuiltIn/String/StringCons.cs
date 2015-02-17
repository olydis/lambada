using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StringCons : BuiltInExpression
    {
        public static readonly Node Instance = new StringCons().AsNode();

        private StringCons() { }

        public override Node Call(Node argument)
        {
            return new StringCons1(argument).AsNode();
        }
    }
    class StringCons1 : BuiltInExpression
    {
        public StringCons1(Node arg) { this.arg = arg;  }

        Node arg;

        public override Node Call(Node argument)
        {
            return StringX.FromString(StringX.ValueOfNode(arg) + StringX.ValueOfNode(argument));
        }
    }
}
