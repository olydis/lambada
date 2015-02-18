using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public abstract class Pair : Expression
    {
        public static Node GetFirst(Node node)
        {
            node.Reduce();
            if (node.Expression is Pair)
            {
                Pair pair = node.Expression as Pair;
                return pair.First;
            }

            return Node.CreateApplication2(node, K.Instance).GetReducedForm();
        }
        public static Node GetSecond(Node node)
        {
            node.Reduce();
            if (node.Expression is Pair)
            {
                Pair pair = node.Expression as Pair;
                return pair.Second;
            }

            return Node.CreateApplication2(node, Node.CreateApplication2(K.Instance, I.Instance)).GetReducedForm();
        }

        protected abstract Node First { get; }
        protected abstract Node Second { get; }

        public override Node Call(Node argument)
        {
            return Node.CreateApplication3(argument, First, Second);
        }

        public override string MachineState
        {
            get
            {
                return MachineStateApply(MachineStateApply(MakePair.Literal, First.MachineState), Second.MachineState);
            }
        }
    }
}
