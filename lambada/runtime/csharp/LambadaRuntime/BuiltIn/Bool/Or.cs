using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Or : BuiltinExpression
    {
        public static string Literal { get { return "or"; } }
        public static readonly Node Instance = new Or().AsNode();

        private Or() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new Or1(argument).AsNode();
        }
    }
    class Or1 : Expression
    {
        Node operand;

        public Or1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return Bool.GetBool(Bool.ValueOfNode(operand) || Bool.ValueOfNode(argument));
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(Or.Literal, operand.MachineState);
            }
        }
    }
}
