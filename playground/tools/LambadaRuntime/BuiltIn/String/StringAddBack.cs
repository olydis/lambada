using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StringAddBack : BuiltinExpression
    {
        public static string Literal { get { return "strAddBack"; } }
        public static readonly Node Instance = new StringAddBack().AsNode();

        private StringAddBack() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new StringAddBack1(argument).AsNode();
        }
    }
    class StringAddBack1 : Expression
    {
        public StringAddBack1(Node arg) { this.arg = arg; }

        Node arg;

        public override Node Call(Node argument)
        {
            return StringX.FromString(StringX.ValueOfNode(arg) + (char)NatNumber.ValueOfNode(argument));
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(StringAddBack.Literal, arg.MachineState);
            }
        }
    }
}
