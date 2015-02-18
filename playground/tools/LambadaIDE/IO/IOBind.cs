using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class IOBind : BuiltinExpression
    {
        public static string Literal { get { return "ioBind"; } }
        public static readonly Node Instance = new IOBind().AsNode();

        private IOBind() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new IOBind2(argument).AsNode();
        }
    }
    class IOBind2 : Expression
    {
        Node basis;

        public IOBind2(Node basis) { this.basis = basis; }

        public override Node Call(Node ioOp)
        {
            return new IOBind3(basis, ioOp).AsNode();
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(IOBind.Literal, basis.MachineState);
            }
        }
    }
    class IOBind3 : Expression
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


        public override string MachineState
        {
            get
            {
                return MachineStateApply(MachineStateApply(IOBind.Literal, basis.MachineState), ioOp.MachineState);
            }
        }
    }
}
