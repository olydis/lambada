using System;
using System.Collections.Generic;
using System.Linq;


namespace LightModel
{
    public class Application : Expression
    {
        public Application(Node[] args)
        {
            if (args.Length < 2)
                throw new Exception("to few elements in args");
            Node[] args2 = new Node[args.Length - 1];
            for (int i = 0; i < args.Length - 1; i++)
                args2[i] = args[i];
            this.A = args.Length == 2 ? args.First() as Node : Node.CreateApplication(args2);
            this.B = args[args.Length - 1];
        }

        Node _a;
        Node _b;
        public Node A { get { return _a; } private set { _a = value; } }
        public Node B { get { return _b; } private set { _b = value; } }

        public override bool Reducible
        {
            get { return true; }
        }

        public override Node Call(Node argument)
        {
            return new Node(new Application(new Node[] { new Node(this), argument }));
        }

        public override string ReadableHuman
        {
            get
            {
                return "(" + A.Expression + " " + B.Expression + ")";
            }
        }

        public override int Complexity
        {
            get { return A.Complexity + B.Complexity + 1; }
        }
    }
}
