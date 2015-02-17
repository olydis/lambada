using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StringTake : BuiltInExpression
    {
        public static readonly Node Instance = new StringTake().AsNode();

        private StringTake() { }

        public override Node Call(Node argument)
        {
            return new StringTake1(argument).AsNode();
        }
    }
    class StringTake1 : BuiltInExpression
    {
        Node operand;

        public StringTake1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return StringX.FromString(StringX.ValueOfNode(operand).Substring(0, (int)NatNumber.ValueOfNode(argument)));
        }
    }
}
