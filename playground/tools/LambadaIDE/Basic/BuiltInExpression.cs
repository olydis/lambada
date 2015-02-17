using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public abstract class BuiltInExpression : Expression
    {
        public override string ReadableHuman
        {
            get
            {
                return GetType().Name;
            }
        }

        public override int Complexity
        {
            get { return 1; }
        }
    }
}
