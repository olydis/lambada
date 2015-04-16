using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StringAddFront : BuiltinExpression
    {
        public static string Literal { get { return "strAddFront"; } }
        public static readonly Node Instance = new StringAddFront().AsNode();

        private StringAddFront() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new StringAddFront1(argument).AsNode();
        }
    }
    class StringAddFront1 : Expression
    {
        public StringAddFront1(Node arg) { this.arg = arg; }

        Node arg;

        public override Node Call(Node argument)
        {
            return StringX.FromString((char)NatNumber.ValueOfNode(argument) + StringX.ValueOfNode(arg));
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(StringAddFront.Literal, arg.MachineState);
            }
        }
    }
}
