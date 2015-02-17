using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class And : BuiltInExpression
    {
        public static readonly Node Instance = new And().AsNode();

        private And() { }

        public override Node Call(Node argument)
        {
            return new And1(argument).AsNode();
        }
    }
    class And1 : BuiltInExpression
    {
        Node operand;

        public And1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return Bool.GetBool(Bool.ValueOfNode(operand) && Bool.ValueOfNode(argument));
        }
    }
}
