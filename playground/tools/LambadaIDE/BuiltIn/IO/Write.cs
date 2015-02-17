using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Write : BuiltInExpression
    {
        public static readonly Node Instance = new Write().AsNode();

        private Write() { }

        public override Node Call(Node argument)
        {
            return new IOReturnValue(I.Instance, () => Console.Write(StringX.ValueOfNode(argument))).AsNode();
        }
    }
}
