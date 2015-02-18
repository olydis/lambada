using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public class RealPair : Pair
    {
        Node first;
        Node second;

        public RealPair(Node first, Node second)
        {
            this.first = first;
            this.second = second;
        }

        protected override Node First
        {
            get { return first; }
        }

        protected override Node Second
        {
            get { return second; }
        }
    }
}
