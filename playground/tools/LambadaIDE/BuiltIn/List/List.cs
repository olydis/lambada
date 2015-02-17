using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    /*public class List : BuiltInExpression
    {
        public static readonly Node emptyList = new List(Enumerable.Empty<Node>()).AsNode();

        static IEnumerable<Node> valueOfNode(Node node)
        {
            node.Reduce();

            bool indicatorX = false;
            Node elemX = null;
            Node tailX= null;
            var tail = new Hook("tail", t => 
            {
                tailX = t;
            }).AsNode();
            var elem = new Hook("elem", x => 
            {
                elemX = x;
                return tail;
            }).AsNode();
            var indicator = new Hook("indicator", b => 
            {
                indicatorX = Bool.ValueOfNode(b);
                return elem;
            }).AsNode();

            while (true)
            {
                Node.CreateApplication2(node, indicator).Reduce();
                if (!indicatorX)
                    yield break;

                yield return elemX;
                node = tailX;
            }
        }
        public static IEnumerable<Node> ValueOfNode(Node node)
        {
            node.Reduce();
            if (node.Expression is List)
            {
                List val = node.Expression as List;
                return val.list;
            }
            IEnumerable<Node> fast = valueOfNode(node);
            node.Boost(new List(fast).AsNode());
            return fast;
        }

        public static Node FromString(string s)
        {
            List<Node> temp = new List<Node>();
            for (int i = 0; i < s.Length; i++)
                temp.Add(new NatNumber((uint)s[i]).AsNode());
            return new List(temp).AsNode();
        }

        public List(IEnumerable<Node> list)
        {
            this.list = list;
        }

        IEnumerable<Node> list;

        public override Node Call(Node argument)
        {
            if (list.Any())
                return Node.CreateApplication4(argument, Bool.TrueX, list.First(), new List(list.Skip(1)).AsNode());
            else
                return Node.CreateApplication2(argument, Bool.FalseX);
        }
    }*/
    public class List : Pair
    {
        public static readonly Node emptyList = new List(Enumerable.Empty<Node>()).AsNode();

        static IEnumerable<Node> valueOfNode(Node node)
        {
            node.Reduce();

            while (Bool.ValueOfNode(Pair.GetFirst(node)))
            {
                node = Pair.GetSecond(node);
                yield return Pair.GetFirst(node);
                node = Pair.GetSecond(node);
            }
        }
        public static IEnumerable<Node> ValueOfNode(Node node)
        {
            node.Reduce();
            if (node.Expression is List)
            {
                List val = node.Expression as List;
                return val.list;
            }
            IEnumerable<Node> fast = valueOfNode(node);
            node.Boost(new List(fast).AsNode());
            return fast;
        }

        public static Node FromString(string s)
        {
            List<Node> temp = new List<Node>();
            for (int i = 0; i < s.Length; i++)
                temp.Add(new NatNumber((uint)s[i]).AsNode());
            return new List(temp).AsNode();
        }

        public List(IEnumerable<Node> list)
        {
            this.list = list;
            f = new LazyNode(delegate() { return Bool.GetBool(list.Any()); });
            s = new LazyNode(delegate()
            {
                return list.Any()
                        ? new Cons(list.First(), list.Skip(1)).AsNode()
                        : I.Instance;
            });
        }

        IEnumerable<Node> list;

        LazyNode f;
        protected override Node First
        {
            get
            {
                return f.Value;
            }
        }
        LazyNode s;
        protected override Node Second
        {
            get
            {
                return s.Value;
            }
        }
    }

    class Cons : Pair
    {
        public Cons(Node element, IEnumerable<Node> tail)
        {
            this.element = element;
            this.tailNode = new List(tail).AsNode();
        }

        Node element;
        Node tailNode;

        protected override Node First
        {
            get { return element; }
        }

        protected override Node Second
        {
            get { return tailNode; }
        }
    }
}
