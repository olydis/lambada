using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Mul : BuiltinExpression
    {
        public static string Literal { get { return "mul"; } }
        public static readonly Node Instance = new Mul().AsNode();

        private Mul() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new Mul1(argument).AsNode();
        }
    }
    class Mul1 : Expression
    {
        Node operand;

        public Mul1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return NatNumber.Get(NatNumber.ValueOfNode(operand) * NatNumber.ValueOfNode(argument));
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(Mul.Literal, operand.MachineState);
            }
        }
    }
}
