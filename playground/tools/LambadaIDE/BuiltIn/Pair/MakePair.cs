using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class MakePair : BuiltInExpression
    {
        public static readonly Node Instance = new MakePair().AsNode();

        private MakePair() { }

        public override Node Call(Node argument)
        {
            return new MakePair1(argument).AsNode();
        }
    }
    class MakePair1 : BuiltInExpression
    {
        Node operand;

        public MakePair1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return new RealPair(operand, argument).AsNode();
        }
    }
}
