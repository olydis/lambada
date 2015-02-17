using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class K : BuiltInExpression
    {
        public static readonly Node Instance = new K().AsNode();

        private K() { }

        public override Node Call(Node argument)
        {
            return new Node(new K1(argument));
        }

    }
    class K1 : BuiltInExpression
    {
        public K1(Node x)
        {
            this.x = x;
        }

        Node x;

        public override Node Call(Node argument)
        {
            return x;
        }
    }
}
