using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class WriteLine : BuiltInExpression
    {
        public static readonly Node Instance = new WriteLine().AsNode();

        private WriteLine() { }

        public override Node Call(Node argument)
        {
            return new IOReturnValue(I.Instance, () => Console.WriteLine(StringX.ValueOfNode(argument))).AsNode();
        }
    }
}
