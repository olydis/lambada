using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class S : BuiltinExpression
    {
        public static string Literal { get { return "s"; } }
        public static readonly Node Instance = new S().AsNode();

        private S() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new Node(new S1(argument));
        }
    }

    class S1 : Expression
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


        public override string MachineState
        {
            get
            {
                return MachineStateApply(S.Literal, x.MachineState);
            }
        }
    }
    class S2 : Expression
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


        public override string MachineState
        {
            get
            {
                return MachineStateApply(MachineStateApply(S.Literal, x.MachineState), y.MachineState);
            }
        }
    }
}
