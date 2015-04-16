using LambadaRuntime.Basic;
using System;
using System.Collections.Generic;
using System.Linq;

namespace LambadaRuntime
{
    class LazyNode
    {
        public LazyNode(Func<Node> factory)
        {
            this.factory = factory;
            this.executed = false;
        }

        Func<Node> factory;

        bool executed;
        Node value;

        public Node Value
        {
            get
            {
                if (!executed)
                {
                    value = factory();
                    executed = true;
                }
                return value;
            }
        }
    }
}
