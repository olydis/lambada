using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StringEquals : BuiltinExpression
    {
        public static string Literal { get { return "strEquals"; } }
        public static readonly Node Instance = new StringEquals().AsNode();

        private StringEquals() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new StringEquals1(argument).AsNode();
        }
    }
    class StringEquals1 : Expression
    {
        Node operand;

        public StringEquals1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return Bool.GetBool(StringX.ValueOfNode(operand) == StringX.ValueOfNode(argument));
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(StringEquals.Literal, operand.MachineState);
            }
        }
    }
}
