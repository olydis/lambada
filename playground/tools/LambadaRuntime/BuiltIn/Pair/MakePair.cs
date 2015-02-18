using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class MakePair : BuiltinExpression
    {
        public static string Literal { get { return "Pair"; } }
        public static readonly Node Instance = new MakePair().AsNode();

        private MakePair() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new MakePair1(argument).AsNode();
        }
    }
    class MakePair1 : Expression
    {
        Node operand;

        public MakePair1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            return new RealPair(operand, argument).AsNode();
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(MakePair.Literal, operand.MachineState);
            }
        }
    }
}
