using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace LambadaRuntime.Basic
{
    public class Abstraction : Expression
    {
        string machineState;
        Func<Node, Node> func;

        public Abstraction(string machineState, Func<Node, Node> f)
        {
            this.machineState = machineState;
            this.func = f;
        }

        public override Node Call(Node argument)
        {
            return func(argument);
        }

        public override string MachineState
        {
            get { return machineState; }
        }
    }
}
