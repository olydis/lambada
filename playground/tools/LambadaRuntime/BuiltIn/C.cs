using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class C : BuiltinExpression
    {
        public static string Literal { get { return "c"; } }
        public static readonly Node Instance = new C().AsNode();

        private C() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new C1(argument).AsNode();
        }

    }
    class C1 : Expression
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

        public override string MachineState
        {
            get
            {
                return MachineStateApply(C.Literal, x.MachineState);
            }
        }
    }
    class C2 : Expression
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

        public override string MachineState
        {
            get
            {
                return MachineStateApply(MachineStateApply(C.Literal, x.MachineState), y.MachineState);
            }
        }
    }
}
