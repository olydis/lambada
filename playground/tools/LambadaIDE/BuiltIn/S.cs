using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class S : BuiltInExpression
    {
        public static readonly Node Instance = new S().AsNode();

        private S() { }

        public override Node Call(Node argument)
        {
            return new Node(new S1(argument));
        }
    }

    class S1 : BuiltInExpression
    {
        public S1(Node x)
        {
            this.x = x;
        }

        Node x;

        public override Node Call(Node argument)
        {
            return new Node(new S2(x, argument));
        }
    }
    class S2 : BuiltInExpression
    {
        public S2(Node x, Node y)
        {
            this.x = x;
            this.y = y;
        }

        Node x;
        Node y;

        public override Node Call(Node argument)
        {
            return Node.CreateApplication3(x, argument, Node.CreateApplication2(y, argument));
        }
    }
}
