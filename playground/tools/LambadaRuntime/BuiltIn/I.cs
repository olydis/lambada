using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class I : BuiltinExpression
    {
        public static string Literal { get { return "i"; } }
        public static readonly Node Instance = new I().AsNode();

        private I() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return argument;
        }
    }
}
