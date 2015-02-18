using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StringTail : BuiltinExpression
    {
        public static string Literal { get { return "strTail"; } }
        public static readonly Node Instance = new StringTail().AsNode();

        private StringTail() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return StringX.FromString(StringX.ValueOfNode(argument).Substring(1));
        }
    }
}
