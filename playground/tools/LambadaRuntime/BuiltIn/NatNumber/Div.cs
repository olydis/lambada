using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Div : BuiltinExpression
    {
        public static string Literal { get { return "div"; } }
        public static readonly Node Instance = new Div().AsNode();

        private Div() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new Div1(argument).AsNode();
        }
    }
    class Div1 : Expression
    {
        Node operand;

        public Div1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            uint a = NatNumber.ValueOfNode(operand);
            uint b = NatNumber.ValueOfNode(argument);

            return NatNumber.Get(a / b);
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(Div.Literal, operand.MachineState);
            }
        }
    }
}
