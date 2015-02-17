using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StringWhere : BuiltInExpression
    {
        public static readonly Node Instance = new StringWhere().AsNode();

        private StringWhere() { }

        public override Node Call(Node argument)
        {
            return new StringWhere1(argument).AsNode();
        }
    }
    class StringWhere1 : BuiltInExpression
    {
        public StringWhere1(Node arg) { this.arg = arg; }

        Node arg;

        public override Node Call(Node argument)
        {
            var str = StringX.ValueOfNode(arg).Where(c => Bool.ValueOfNode(Node.CreateApplication2(argument, NatNumber.Get(c)))).ToArray();
            return StringX.FromString(new string(str));
        }
    }
}
