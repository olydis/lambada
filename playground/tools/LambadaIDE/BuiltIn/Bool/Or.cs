using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Or : BuiltInExpression
    {
        public static readonly Node Instance = new Or().AsNode();

        private Or() { }

        public override Node Call(Node argument)
        {
            return new Or1(argument).AsNode();
        }
    }
    class Or1 : BuiltInExpression
    {
        Node operand;

        public Or1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return Bool.GetBool(Bool.ValueOfNode(operand) || Bool.ValueOfNode(argument));
        }
    }
}
