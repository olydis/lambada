using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class B : BuiltinExpression
    {
        public static string Literal { get { return "b"; } }
        public static readonly Node Instance = new B().AsNode();

        private B() : base(Literal){ }

        public override Node Call(Node argument)
        {
            return new B1(argument).AsNode();
        }

    }
    class B1 : Expression
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

        public override string MachineState
        {
            get
            {
                return MachineStateApply(B.Literal, x.MachineState);
            }
        }
    }
    class B2 : Expression
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

        public override string MachineState
        {
            get
            {
                return MachineStateApply(MachineStateApply(B.Literal, x.MachineState), y.MachineState);
            }
        }
    }
}
