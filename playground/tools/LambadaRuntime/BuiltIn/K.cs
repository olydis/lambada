using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class K : BuiltinExpression
    {
        public static string Literal { get { return "k"; } }
        public static readonly Node Instance = new K().AsNode();

        private K() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new Node(new K1(argument));
        }

    }
    class K1 : Expression
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


        public override string MachineState
        {
            get
            {
                return MachineStateApply(K.Literal, x.MachineState);
            }
        }
    }
}
