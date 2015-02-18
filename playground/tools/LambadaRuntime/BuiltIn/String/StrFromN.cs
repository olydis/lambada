using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StrFromN : BuiltinExpression
    {
        public static string Literal { get { return "strFromN"; } }
        public static readonly Node Instance = new StrFromN().AsNode();

        private StrFromN() : base(Literal){ }

        public override Node Call(Node argument)
        {
            return StringX.FromString(NatNumber.ValueOfNode(argument).ToString());
        }
    }
}
