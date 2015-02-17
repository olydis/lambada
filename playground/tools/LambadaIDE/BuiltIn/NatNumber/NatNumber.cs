using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class NatNumber : BuiltInExpression
    {
        static readonly int MAX_CACHE = 65536;
        static Node[] cache = Enumerable.Range(0, MAX_CACHE).Select(i => new NatNumber((uint)i).AsNode()).ToArray();

        public static uint ValueOfNode(Node node)
        {
            node.Reduce();

            uint number = 0;

            Node detector = null;
            Node inner = new Hook("n", n =>
                        {
                            number++;
                            return Node.CreateApplication2(detector, n);
                        }).AsNode();
            detector = new Hook("detect", str =>
            {
                if (str.Expression is NatNumber)
                {
                    number += (str.Expression as NatNumber).Number;
                    return I.Instance;
                }
                else
                    return Node.CreateApplication3(str, I.Instance, inner);
            }).AsNode();

            Node.CreateApplication2(detector, node).Reduce();
            return number;
        }

        uint _value;
        public uint Number { get { return _value; } private set { _value = value; } }

        LazyNode c1Consumer;

        private NatNumber(uint number)
        {
            this.Number = number;

            this.c1Consumer = new LazyNode(() =>
                new Hook("c1 consumer", argument => Node.CreateApplication2(
                    argument,
                    NatNumber.Get(_value - 1))
                    ).AsNode()
                );
        }

        public override Node Call(Node argument)
        {
            if (_value == 0)
                return Node.CreateApplication2(K.Instance, argument);
            else
                return c1Consumer.Value;
        }

        public override string ReadableHuman
        {
            get
            {
                return _value.ToString();
            }
        }

        public static Node Get(uint n)
        {
            if (n < MAX_CACHE)
                return cache[n];
            return new NatNumber(n).AsNode();
        }
    }
}
