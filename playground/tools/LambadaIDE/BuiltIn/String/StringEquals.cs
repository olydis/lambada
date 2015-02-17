using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StringEquals : BuiltInExpression
    {
        public static readonly Node Instance = new StringEquals().AsNode();

        private StringEquals() { }

        public override Node Call(Node argument)
        {
            return new StringEquals1(argument).AsNode();
        }
    }
    class StringEquals1 : BuiltInExpression
    {
        Node operand;

        public StringEquals1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return Bool.GetBool(StringX.ValueOfNode(operand) == StringX.ValueOfNode(argument));
        }
    }
}
