using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Not : BuiltinExpression
    {
        public static string Literal { get { return "not"; } }
        public static readonly Node Instance = new Not().AsNode();

        private Not() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return Bool.GetBool(!Bool.ValueOfNode(argument));
        }
    }
}
