using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    // U = f => f (x => y => z => x z (y z)) (a => b => a)
    public class U : BuiltinExpression
    {
        public static string Literal { get { return "u"; } }
        public static readonly Node Instance = new U().AsNode();

        private U() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return
                Node.CreateApplication3(
                    argument,
                    S.Instance,
                    K.Instance
                );
        }
    }
}
