using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StringHead : BuiltinExpression
    {
        public static string Literal { get { return "strHead"; } }
        public static readonly Node Instance = new StringHead().AsNode();

        private StringHead() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return NatNumber.Get(StringX.ValueOfNode(argument)[0]);
        }
    }
}
