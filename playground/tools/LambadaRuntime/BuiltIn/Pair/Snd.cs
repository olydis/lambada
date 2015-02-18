using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Snd : BuiltinExpression
    {
        public static string Literal { get { return "snd"; } }
        public static readonly Node Instance = new Snd().AsNode();

        private Snd() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return Pair.GetSecond(argument);
        }
    }
}
