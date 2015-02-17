using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public class StringX : BuiltInExpression
    {
        public static readonly Node emptyString = FromString("");

        public static string ValueOfNode(Node node)
        {
            node.Reduce();

            Node orig = node;

            string result = "";

            Node detector = null;
            Node inner = new Hook("head", head =>
                            new Hook("tail", tail =>
                                {
                                    result += ((char)NatNumber.ValueOfNode(head)).ToString();
                                    return Node.CreateApplication2(detector, tail);
                                }).AsNode()).AsNode();
            detector = new Hook("detect", str => 
                {
                    if (str.Expression is StringX)
                    {
                        result += (str.Expression as StringX).value;
                        return I.Instance;
                    }
                    else
                        return Node.CreateApplication3(str, I.Instance, inner);
                }).AsNode();

            Node.CreateApplication2(detector, node).Reduce();
            
            orig.Boost(StringX.FromString(result));
            return result;
        }

        public static Node FromString(string s)
        {
            return new StringX(s).AsNode();
        }

        LazyNode c1Consumer;

        string value;
        public StringX(string str)
        {
            this.value = str;
            this.c1Consumer = new LazyNode(() =>
                new Hook("c1 consumer", argument => Node.CreateApplication3(
                    argument,
                    NatNumber.Get((uint)str.First()),
                    StringX.FromString(str.Substring(1)))
                    ).AsNode()
                );
        }

        public override string ReadableHuman
        {
            get
            {
                return "\"" + value + "\"";
            }
        }
         
        public override Node Call(Node argument)
        {
            if (value == "")
                return Node.CreateApplication2(K.Instance, argument);
            else
                return c1Consumer.Value;
        }
    }
}
