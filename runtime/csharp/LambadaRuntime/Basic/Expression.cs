using LambadaRuntime.BuiltIn;
using System;
using System.Collections.Generic;
using System.Linq;

namespace LambadaRuntime.Basic
{
    public abstract class Expression
    {
        public static Expression CreateDummy()
        {
            return new Abstraction("i", x => x);
        }

        static readonly Expression dummy = CreateDummy();
        public static Expression Dummy
        {
            get
            {
                return dummy;
            }
        }

        protected static string MachineStateApply(string mstate1, string mstate2)
        {
            return mstate1 + " " + mstate2 + ".";
        }

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
        /// Has the responsibility to return semantically correct result of call (does NOT need to be reduced!); context: the application is reduced, so predictable deferred argument reductions are allowed to be made!
        /// </summary>
        /// <param name="argument">argument for this call</param>
        /// <returns>return value of function call</returns>
        public abstract Node Call(Node argument);

        public Node AsNode()
        {
            return new Node(this);
        }

        public abstract string MachineState { get; }

        public override string ToString()
        {
            return MachineState;
        }
    }
}
