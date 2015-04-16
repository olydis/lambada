using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class StringWhere : BuiltinExpression
    {
        public static string Literal { get { return "strWhere"; } }
        public static readonly Node Instance = new StringWhere().AsNode();

        private StringWhere() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new StringWhere1(argument).AsNode();
        }
    }
    class StringWhere1 : Expression
    {
        public StringWhere1(Node arg) { this.arg = arg; }

        Node arg;

        public override Node Call(Node argument)
        {
            var str = StringX.ValueOfNode(arg).ToCharArray().Where(c => Bool.ValueOfNode(Node.CreateApplication2(argument, NatNumber.Get(c)))).ToArray();
            return StringX.FromString(new string(str));
        }


        public override string MachineState
        {
            get
            {
                return MachineStateApply(StringWhere.Literal, arg.MachineState);
            }
        }
    }
}
