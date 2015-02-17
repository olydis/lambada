using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public abstract class Expression
    {
        /// <summary>
        /// Determines whether this expression is reducible or not
        /// </summary>
        public virtual bool Reducible
        {
            get
            {
                return false;
            }
        }

        /// <summary>
        /// Has responsibility to shallow reduce 
        /// </summary>
        /// <returns>shallowly reduced expression</returns>
        public virtual Node Reduce()
        {
            throw new Exception("not supported");
        }

        /// <summary>
        /// Has responsibility to FULLY reduce
        /// </summary>
        /// <returns>fully reduced expression</returns>
        public virtual Node FullReduce()
        {
            throw new Exception("not supported");
        }

        /// <summary>
        /// Has the responsibility to return semantically correct result of call (does NOT need to be reduced!); context: the application is reduced, so predictable deferred argument reductions are allowed to be made!
        /// </summary>
        /// <param name="argument">argument for this call</param>
        /// <returns>return value of function call</returns>
        public abstract Node Call(Node argument);

        public Node AsNode()
        {
            return new Node(this);
        }
        public abstract int Complexity { get; }

        public abstract string ReadableHuman { get; }

        public override string ToString()
        {
            return ReadableHuman;
        }
    }
}
