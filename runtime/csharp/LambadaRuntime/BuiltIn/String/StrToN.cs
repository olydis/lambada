using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StrToN : BuiltinExpression
    {
        public static string Literal { get { return "strToN"; } }
        public static readonly Node Instance = new StrToN().AsNode();

        private StrToN() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return NatNumber.Get(uint.Parse(StringX.ValueOfNode(argument)));
        }
    }
}
