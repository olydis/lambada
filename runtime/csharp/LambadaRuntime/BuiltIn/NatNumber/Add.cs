using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Add : BuiltinExpression
    {
        public static string Literal { get { return "add"; } }
        public static readonly Node Instance = new Add().AsNode();

        private Add() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new Add1(argument).AsNode();
        }
    }
    class Add1 : Expression
    {
        Node operand;

        public Add1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return NatNumber.Get(NatNumber.ValueOfNode(operand) + NatNumber.ValueOfNode(argument));
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(Add.Literal, operand.MachineState);
            }
        }
    }
}
