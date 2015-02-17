using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class Hook : BuiltInExpression
    {
        static void ignore(Node n) { }
        public static Hook MakeDummy(string name)
        {
            return new Hook(name, (Action<Node>)ignore);
        }
        public static readonly Hook dummy = MakeDummy("dummy");
        
        public Hook(string name, Action<Node> action)
        {
            this.name = name;
            this.action = x => { action(x); return x; };
        }
        public Hook(string name, Func<Node, Node> transformer)
        {
            this.name = name;
            this.action = transformer;
        }

        string name;
        Func<Node, Node> action;

        public override Node Call(Node argument)
        {
            return action(argument);
        }
    }
}
