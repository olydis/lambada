using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class I : BuiltInExpression
    {
        public static readonly Node Instance = new I().AsNode();

        private I() { }

        public override Node Call(Node argument)
        {
            return argument;
        }
    }
}
