using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    // X => IO X
    public class IOReturn : BuiltInExpression
    {
        public static readonly Node Instance = new IOReturn().AsNode();

        private IOReturn() { }

        public override Node Call(Node argument)
        {
            return new IOReturnValue(argument).AsNode();
        }
    }
    // IO
    public class IOReturnValue : BuiltInExpression
    {
        Func<Node> sideEffect;

        public IOReturnValue(Func<Node> calculation) { this.sideEffect = calculation; }
        public IOReturnValue(Node toReturn, Action sideEffect) : this(() => { sideEffect(); return toReturn; }) { }
        public IOReturnValue(Node toReturn) : this(() => { return toReturn; }) { }

        public override Node Call(Node argument)
        {
            var operand = sideEffect();
            return new RealPair(Node.CreateApplication2(Succ.Instance, argument), operand).AsNode();
        }
    }
}
