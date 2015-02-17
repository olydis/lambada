using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Add : BuiltInExpression
    {
        public static readonly Node Instance = new Add().AsNode();

        private Add() { }

        public override Node Call(Node argument)
        {
            return new Add1(argument).AsNode();
        }
    }
    class Add1 : BuiltInExpression
    {
        Node operand;

        public Add1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return NatNumber.Get(NatNumber.ValueOfNode(operand) + NatNumber.ValueOfNode(argument));
        }
    }
}
