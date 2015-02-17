using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Y : BuiltInExpression
    {
        public static readonly Node Instance = new Y().AsNode();

        private Y() { }

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
