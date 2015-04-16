using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    // X => IO X
    public class IOReturn : BuiltinExpression
    {
        public static string Literal { get { return "ioReturn"; } }
        public static readonly Node Instance = new IOReturn().AsNode();

        private IOReturn() : base(Literal) { }

        public override Node Call(Node argument)
        {
            return new IOReturnValue(argument).AsNode();
        }
    }
    // IO
    public class IOReturnValue : Expression
    {
        string machineState;
        Func<Node> sideEffect;

        public IOReturnValue(string machineState, Func<Node> calculation) { this.machineState = machineState; this.sideEffect = calculation; }
        public IOReturnValue(Node toReturn, Action sideEffect) : this(MachineStateApply(IOReturn.Literal, toReturn.MachineState), () => { sideEffect(); return toReturn; }) { }
        public IOReturnValue(Node toReturn) : this(toReturn, () => { }) { }

        public override Node Call(Node argument)
        {
            var operand = sideEffect();
            return new RealPair(Node.CreateApplication2(Succ.Instance, argument), operand).AsNode();
        }


        public override string MachineState
        {
            get
            {
                return machineState;
            }
        }
    }
}
