using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Pow : BuiltinExpression
    {
        public static string Literal { get { return "pow"; } }
        public static readonly Node Instance = new Pow().AsNode();

        private Pow() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new Pow1(argument).AsNode();
        }
    }
    class Pow1 : Expression
    {
        Node operand;

        public Pow1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            uint a = NatNumber.ValueOfNode(operand);
            uint b = NatNumber.ValueOfNode(argument);

            uint num = 1;
            while (b-- != 0)
                num *= a;

            return NatNumber.Get(num);
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(Pow.Literal, operand.MachineState);
            }
        }
    }
}
