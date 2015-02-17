using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StringAddBack : BuiltInExpression
    {
        public static readonly Node Instance = new StringAddBack().AsNode();

        private StringAddBack() { }

        public override Node Call(Node argument)
        {
            return new StringAddBack1(argument).AsNode();
        }
    }
    class StringAddBack1 : BuiltInExpression
    {
        public StringAddBack1(Node arg) { this.arg = arg; }

        Node arg;

        public override Node Call(Node argument)
        {
            return StringX.FromString(StringX.ValueOfNode(arg) + (char)NatNumber.ValueOfNode(argument));
        }
    }
}
