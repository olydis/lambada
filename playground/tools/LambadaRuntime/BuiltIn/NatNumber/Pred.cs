using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Pred : BuiltinExpression
    {
        public static string Literal { get { return "pred"; } }
        public static readonly Node Instance = new Pred().AsNode();

        private Pred() : base(Literal) { }

        public override Node Call(Node argument)
        {
            uint x = NatNumber.ValueOfNode(argument);
            return NatNumber.Get(x == 0 ? 0 : (x - 1));
        }
    }
}
