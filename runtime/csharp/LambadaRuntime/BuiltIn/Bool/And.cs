using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class And : BuiltinExpression
    {
        public static string Literal { get { return "and"; } }
        public static readonly Node Instance = new And().AsNode();

        private And() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new And1(argument).AsNode();
        }
    }
    class And1 : Expression
    {
        Node operand;

        public And1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return Bool.GetBool(Bool.ValueOfNode(operand) && Bool.ValueOfNode(argument));
        }

        public override string MachineState
        {
            get 
            { 
                return MachineStateApply(And.Literal, operand.MachineState); 
            }
        }
    }
}
