using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StringCutAt : BuiltinExpression
    {
        public static string Literal { get { return "strCutAt"; } }
        public static readonly Node Instance = new StringCutAt().AsNode();

        private StringCutAt() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new StringCutAt1(argument).AsNode();
        }
    }
    class StringCutAt1 : Expression
    {
        public StringCutAt1(Node arg) { this.arg = arg; }

        Node arg;

        public override Node Call(Node argument)
        {
            var str = StringX.ValueOfNode(arg);
            int i = 0;
            for (; i < str.Length; i++)
                if (Bool.ValueOfNode(Node.CreateApplication2(argument, NatNumber.Get(str[i]))))
                    break;

            if (i == 0)
                return new RealPair(StringX.emptyString, arg).AsNode();
            else if (i == str.Length)
                return new RealPair(arg, StringX.emptyString).AsNode();

            return new RealPair(
                StringX.FromString(str.Substring(0, i)), 
                StringX.FromString(str.Substring(i))).AsNode();
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(StringCutAt.Literal, arg.MachineState);
            }
        }
    }
}
