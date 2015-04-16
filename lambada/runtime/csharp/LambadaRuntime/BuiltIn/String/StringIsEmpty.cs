using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StringIsEmpty : BuiltinExpression
    {
        public static string Literal { get { return "strIsEmpty"; } }
        public static readonly Node Instance = new StringIsEmpty().AsNode();

        private StringIsEmpty() : base(Literal) { }

        public override Node Call(Node argument)
        {
            var str = StringX.ValueOfNode(argument);
            var length = str.Length;
            return Bool.GetBool(length == 0);
        }
    }
}
