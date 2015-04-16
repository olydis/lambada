using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class WriteLine : BuiltinExpression
    {
        public static string Literal { get { return "writeLine"; } }
        public static readonly Node Instance = new WriteLine().AsNode();

        private WriteLine() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new IOReturnValue(I.Instance, () => Console.WriteLine(StringX.ValueOfNode(argument))).AsNode();
        }
    }
}
