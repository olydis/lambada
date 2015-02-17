using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class IOBind : BuiltInExpression
    {
        public static readonly Node Instance = new IOBind().AsNode();

        private IOBind() { }

        public override Node Call(Node argument)
        {
            return new IOBind2(argument).AsNode();
        }
    }
    class IOBind2 : BuiltInExpression
    {
        Node basis;

        public IOBind2(Node basis) { this.basis = basis; }

        public override Node Call(Node ioOp)
        {
            return new IOBind3(basis, ioOp).AsNode();
        }
    }
    class IOBind3 : BuiltInExpression
    {
        Node basis;
        Node ioOp;

        public IOBind3(Node basis, Node ioOp) { this.basis = basis; this.ioOp = ioOp; }

        public override Node Call(Node world)
        {
            var pair = Node.CreateApplication2(basis, world);
            world = Pair.GetFirst(pair);
            var value = Pair.GetSecond(pair);

            return Node.CreateApplication3(ioOp, value, world);
        }
    }
}
