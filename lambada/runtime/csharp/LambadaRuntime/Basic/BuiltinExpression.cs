using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace LambadaRuntime.Basic
{
    public abstract class BuiltinExpression : Expression
    {
        public BuiltinExpression(string underlyingLiteral)
        {
            this.UnderlyingLiteral = underlyingLiteral;
        }

        public string UnderlyingLiteral { get; private set; }

        public override string MachineState
        {
            get { return UnderlyingLiteral; }
        }
    }
}
