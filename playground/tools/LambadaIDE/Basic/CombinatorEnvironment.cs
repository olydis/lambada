using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;


namespace LightModel
{
    public class CombinatorEnvironment : Expression
    {
        public static CombinatorEnvironment DefaultX = new CombinatorEnvironment();

        public CombinatorEnvironment()
        {
            Reset();
        }

        internal void Reset()
        {
            library = new Dictionary<string, Node>();
        }

        public void Boost(string ind, Node alternative)
        {
            if (!library.ContainsKey(ind))
                library[ind] = alternative;
            else
                library[ind].Boost(alternative);
        }

        Dictionary<string, Node> library;

        public Node this[string ind]
        {
            get
            {
                if (!library.ContainsKey(ind))
                    throw new Exception("key not found");
                else
                    return library[ind];
            }
            set
            {
                //if (!library.ContainsKey(ind))
                library[ind] = value;
            }
        }

        public string Dump()
        {
            //XmlSerializer serializer = new XmlSerializer(typeof(Node));

            StringBuilder builder = new StringBuilder();
            foreach (var v in library)
            {
                builder.AppendLine(v.Key + " = <" + v.Value.GetReducedForm().Expression.GetType().Name + ">");
            }
            return builder.ToString();
        }

        public override Node Call(Node argument)
        {
            string arg = argument.GetOutput();
            if (!library.ContainsKey(arg))
                return this["maybeNothing"];
            return Node.CreateApplication2(this["maybeReturn"], this[arg]);
        }

        public override int Complexity
        {
            get { return 1; }
        }

        public override string ReadableHuman
        {
            get { return "<env mapping>"; }
        }
    }
}
