using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class C : BuiltInExpression
    {
        public static readonly Node Instance = new C().AsNode();

        private C() { }

        public override Node Call(Node argument)
        {
            if (argument.Expression is C1)
                Console.WriteLine();
            return new C1(argument).AsNode();
        }

    }
    class C1 : BuiltInExpression
    {
        public C1(Node x)
        {
            this.x = x;
        }

        Node x;

        public override Node Call(Node argument)
        {
            return new C2(x, argument).AsNode();
        }
    }
    class C2 : BuiltInExpression
    {
        public C2(Node x, Node y)
        {
            this.x = x;
            this.y = y;
        }

        Node x;
        Node y;

        public override Node Call(Node argument)
        {
            return Node.CreateApplication3(x, argument, y);
        }
    }
}
