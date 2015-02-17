using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class B : BuiltInExpression
    {
        public static readonly Node Instance = new B().AsNode();

        private B() { }

        public override Node Call(Node argument)
        {
            return new B1(argument).AsNode();
        }

    }
    class B1 : BuiltInExpression
    {
        public B1(Node x)
        {
            this.x = x;
        }

        Node x;

        public override Node Call(Node argument)
        {
            return new B2(x, argument).AsNode();
        }
    }
    class B2 : BuiltInExpression
    {
        public B2(Node x, Node y)
        {
            this.x = x;
            this.y = y;
        }

        Node x;
        Node y;

        public override Node Call(Node argument)
        {
            x.Reduce();
            //return x.Expression.Call(Node.CreateApplication2(y, argument));
            return Node.CreateApplication2(x, Node.CreateApplication2(y, argument));
        }
    }
}
