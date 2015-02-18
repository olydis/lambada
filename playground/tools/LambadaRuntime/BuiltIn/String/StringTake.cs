using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StringTake : BuiltinExpression
    {
        public static string Literal { get { return "strTake"; } }
        public static readonly Node Instance = new StringTake().AsNode();

        private StringTake() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new StringTake1(argument).AsNode();
        }
    }
    class StringTake1 : Expression
    {
        Node operand;

        public StringTake1(Node operand) { this.operand = operand; }

        public override Node Call(Node argument)
        {
            var str = StringX.ValueOfNode(operand);
            var n = (int)NatNumber.ValueOfNode(argument);
            if (n >= str.Length)
                return operand;
            return StringX.FromString(str.Substring(0, n));
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(StringTake.Literal, operand.MachineState);
            }
        }
    }
}
