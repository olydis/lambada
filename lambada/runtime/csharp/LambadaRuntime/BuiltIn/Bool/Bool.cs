using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class Bool : Expression
    {
        public static bool ValueOfNode(Node node)
        {
            node.Reduce();
            if (node.Expression is Bool)
            {
                Bool x = node.Expression as Bool;
                return x.Value;
            }

            return Node.CreateApplication3(node, Dummy.AsNode(), node).GetReducedForm().Expression == Dummy;
        }
        public static readonly Node TrueX = new Bool(true).AsNode();
        public static readonly Node FalseX = new Bool(false).AsNode();
        public static Node GetBool(bool b)
        {
            return b ? TrueX : FalseX;
        }

        bool _value;
        public bool Value { get { return _value; } private set { _value = value; } }

        private Bool(bool number)
        {
            this.Value = number;
        }

        public override Node Call(Node argument)
        {
            return new Bool1(Value, argument).AsNode();
            //return new Node(Value ? K.Instance : new Node(K.Instance, I.Instance), argument);
        }

        public override string MachineState
        {
            get
            {
                return _value ? "True" : "False";
            }
        }
    }
    class Bool1 : Expression
    {
        bool value;
        Node first;

        public Bool1(bool value, Node first)
        {
            this.value = value;
            this.first = first;
        }

        public override Node Call(Node argument)
        {
            return value ? first : argument;
        }

        public override string MachineState
        {
            get
            {
                return value ? MachineStateApply(K.Literal, first.MachineState) : I.Literal; 
            }
        }
    }
}
