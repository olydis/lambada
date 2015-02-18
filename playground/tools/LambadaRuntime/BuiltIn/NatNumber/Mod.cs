using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Mod : BuiltinExpression
    {
        public static string Literal { get { return "mod"; } }
        public static readonly Node Instance = new Mod().AsNode();

        private Mod() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new Mod1(argument).AsNode();
        }
    }
    class Mod1 : Expression
    {
        Node operand;

        public Mod1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            uint a = NatNumber.ValueOfNode(operand);
            uint b = NatNumber.ValueOfNode(argument);

            return NatNumber.Get(a % b);
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(Mod.Literal, operand.MachineState);
            }
        }
    }
}
