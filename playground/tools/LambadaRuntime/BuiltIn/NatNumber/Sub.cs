using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Sub : BuiltinExpression
    {
        public static string Literal { get { return "sub"; } }
        public static readonly Node Instance = new Sub().AsNode();

        private Sub() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new Sub1(argument).AsNode();
        }
    }
    class Sub1 : Expression
    {
        Node operand;

        public Sub1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            uint a = NatNumber.ValueOfNode(operand);
            uint b = NatNumber.ValueOfNode(argument);

            return NatNumber.Get(a < b ? 0 : a - b);
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(Sub.Literal, operand.MachineState);
            }
        }
    }
}
