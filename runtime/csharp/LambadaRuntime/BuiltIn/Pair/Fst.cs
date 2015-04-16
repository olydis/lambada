using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Fst : BuiltinExpression
    {
        public static string Literal { get { return "fst"; } }
        public static readonly Node Instance = new Fst().AsNode();

        private Fst() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return Pair.GetFirst(argument);
        }
    }
}
