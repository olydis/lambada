using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StringAddFront : BuiltInExpression
    {
        public static readonly Node Instance = new StringAddFront().AsNode();

        private StringAddFront() { }

        public override Node Call(Node argument)
        {
            return new StringAddFront1(argument).AsNode();
        }
    }
    class StringAddFront1 : BuiltInExpression
    {
        public StringAddFront1(Node arg) { this.arg = arg; }

        Node arg;

        public override Node Call(Node argument)
        {
            return StringX.FromString((char)NatNumber.ValueOfNode(argument) + StringX.ValueOfNode(arg));
        }
    }
}
