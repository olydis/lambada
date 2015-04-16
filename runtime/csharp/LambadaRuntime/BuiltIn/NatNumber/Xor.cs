using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Xor : BuiltinExpression
    {
        public static string Literal { get { return "xor"; } }
        public static readonly Node Instance = new Xor().AsNode();

        private Xor() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new Xor1(argument).AsNode();
        }
    }
    class Xor1 : Expression
    {
        Node operand;

        public Xor1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            uint a = NatNumber.ValueOfNode(operand);
            uint b = NatNumber.ValueOfNode(argument);

            return NatNumber.Get(a ^ b);
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(Xor.Literal, operand.MachineState);
            }
        }
    }
}
