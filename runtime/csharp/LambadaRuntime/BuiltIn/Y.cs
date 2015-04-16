using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Y : BuiltinExpression
    {
        public static string Literal { get { return "y"; } }
        public static readonly Node Instance = new Y().AsNode();

        private Y() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return
                Node.CreateApplication2(
                    argument,
                    Node.CreateApplication2(Instance, argument)
                );
        }
    }
}
