using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    // U = f => f (x => y => z => x z (y z)) (a => b => a)
    public class U : BuiltInExpression
    {
        public static readonly Node Instance = new U().AsNode();

        private U() { }

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
