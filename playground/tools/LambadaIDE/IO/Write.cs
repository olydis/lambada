using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Write : BuiltinExpression
    {
        public static string Literal { get { return "write"; } }
        public static readonly Node Instance = new Write().AsNode();

        private Write() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new IOReturnValue(I.Instance, () => Console.Write(StringX.ValueOfNode(argument))).AsNode();
        }
    }
}
