using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Bean : BuiltInExpression
    {
        public static readonly Node Empty = new Bean().AsNode();

        Dictionary<string, Node> data;

        private Bean() { data = new Dictionary<string, Node>(); }
        internal Bean(Dictionary<string, Node> data) 
        {
            this.data = new Dictionary<string, Node>(data);
        }

        public override Node Call(Node argument)
        {
            string key = argument.GetOutput();
            if (data.ContainsKey(key))
                return new RealPair(Bool.TrueX, data[key]).AsNode();
            return new RealPair(Bool.FalseX, I.Instance).AsNode();
        }
    }
}
