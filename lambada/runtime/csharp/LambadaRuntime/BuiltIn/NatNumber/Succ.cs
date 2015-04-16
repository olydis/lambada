using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Succ : BuiltinExpression
    {
        public static string Literal { get { return "Succ"; } }
        public static readonly Node Instance = new Succ().AsNode();

        private Succ() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return NatNumber.Get(NatNumber.ValueOfNode(argument) + 1);
        }
    }
}
