using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StringCons : BuiltinExpression
    {
        public static string Literal { get { return "strCons"; } }
        public static readonly Node Instance = new StringCons().AsNode();

        private StringCons() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new StringCons1(argument).AsNode();
        }
    }
    class StringCons1 : Expression
    {
        public StringCons1(Node arg) { this.arg = arg;  }

        Node arg;

        public override Node Call(Node argument)
        {
            return StringX.FromString(StringX.ValueOfNode(arg) + StringX.ValueOfNode(argument));
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(StringCons.Literal, arg.MachineState);
            }
        }
    }
}
