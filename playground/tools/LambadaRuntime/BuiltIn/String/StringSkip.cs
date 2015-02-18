using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StringSkip : BuiltinExpression
    {
        public static string Literal { get { return "strSkip"; } }
        public static readonly Node Instance = new StringSkip().AsNode();

        private StringSkip() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new StringSkip1(argument).AsNode();
        }
    }
    class StringSkip1 : Expression
    {
        Node operand;

        public StringSkip1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            var str = StringX.ValueOfNode(operand);
            var n = (int)NatNumber.ValueOfNode(argument);
            if (n >= str.Length)
                return StringX.emptyString;
            return StringX.FromString(str.Substring(n));
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(StringSkip.Literal, operand.MachineState);
            }
        }
    }
}
