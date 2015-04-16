using LambadaRuntime.BuiltIn;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
namespace LambadaRuntime.Basic
{
    abstract class Token { }
    class TApp : Token { public override string ToString() { return "."; } }
    class TTerm : Token { public override string ToString() { return "."; } }
    class TLiteral : Token { public string Text; public override string ToString() { return Text; } public TLiteral(string text) { this.Text = text; } }
    class TValue : Token { public Node value; public override string ToString() { return value.ToString(); } public TValue(Node value) { this.value = value; } }


    public class Node
    {
        public static void Parse(string expression, CombinatorEnvironment env)
        {
            Queue<char> temp = new Queue<char>((expression + " ").ToCharArray());
            
            Queue<Token> result = Tokenize(temp);

            while (result.Count > 0)
            {
                string target = (result.Dequeue() as TLiteral).Text;

                Debug.WriteLine(target);

                Node res = Parsec(result, env);
                //res = Node.CreateApplication2(I.Instance, res);
                res.MachineState = target;
                env[target] = res;
            }
        }
        static Node Parsec(Queue<Token> tokens, CombinatorEnvironment env)
        {
            Stack<Node> n = new Stack<Node>();

            Token current;
            while (!((current = tokens.Dequeue()) is TTerm))
            {
                if (current is TApp)
                {
                    Node b = n.Pop();
                    Node a = n.Pop();
                    n.Push(Node.CreateApplication2(a, b));
                }
                if (current is TValue)
                    n.Push((current as TValue).value);
                if (current is TLiteral)
                {
                    string lit = (current as TLiteral).Text;
                    try
                    {
                        n.Push(env[lit]);
                    }
                    catch
                    {
                        throw new Exception("Could not find: " + lit);
                    }
                }
            }

            if (n.Count != 1)
                throw new Exception("bad format");
            return n.Pop();
        }
        static Queue<Token> Tokenize(Queue<char> stream)
        {
            Queue<Token> tokens = new Queue<Token>();
            eatWhitespace(stream);
            int parity = 0;
            while (stream.Count != 0)
            {
                switch (stream.Peek())
                {
                    case '.':
                        stream.Dequeue();
                        parity--;

                        if (parity == 1)
                        {
                            tokens.Enqueue(new TTerm());
                            parity = 0;
                        }
                        else if (parity > 1)
                            tokens.Enqueue(new TApp());
                        else
                            throw new Exception("app parity issue");
                        break;
                    default:
                        string lit = parseLiteral(stream);
                        parity++;
                        if (lit != null)
                            tokens.Enqueue(new TLiteral(lit));
                        else
                        {
                            Node val = parseN(stream) ?? parseS(stream);
                            if (val != null)
                                tokens.Enqueue(new TValue(val));
                            else
                                throw new Exception("invalid literal format");
                        }
                        break;
                }
                eatWhitespace(stream);
            }
            if (parity != 0)
                throw new Exception("app parity issue");
            return tokens;
        }
        static bool charIsWhiteSpace(char c)
        {
            return c == ' '
                || c == '\t'
                || c == '\n'
                || c == '\r';
        }
        static bool charIsLetter(char c)
        {
            return c == '_'
                || c == ':'
                || ('a' <= c && c <= 'z')
                || ('A' <= c && c <= 'Z');
        }
        static bool charIsDigit(char c)
        {
            return '0' <= c && c <= '9';
        }
        static bool charIsLetterOrDigit(char c)
        {
            return charIsLetter(c) || charIsDigit(c);
        }
        static void eatWhitespace(Queue<char> stream)
        {
            while (stream.Count > 0 && charIsWhiteSpace(stream.Peek()))
                stream.Dequeue();
        }
        static string parseLiteral(Queue<char> stream)
        {
            if (stream.Count == 0 || !charIsLetter(stream.Peek()))
                return null;

            string s = stream.Dequeue().ToString();
            while (stream.Count > 0 && charIsLetterOrDigit(stream.Peek()))
                s += stream.Dequeue();

            return s;
        }
        static Node parseN(Queue<char> stream)
        {
            if (stream.Count == 0 || !charIsDigit(stream.Peek()))
                return null;

            string s = stream.Dequeue().ToString();
            while (stream.Count > 0 && charIsDigit(stream.Peek()))
                s += stream.Dequeue();

            return NatNumber.Get((uint)int.Parse(s));
        }
        static Node parseS(Queue<char> stream)
        {
            if (stream.Count == 0 || stream.Peek() != '\"')
                return null;

            stream.Dequeue();
            string s = "";
            while (stream.Count > 0 && stream.Peek() != '\"')
                s += stream.Dequeue();
            stream.Dequeue();

            return StringX.FromString(s);
        }

        public Node(Expression expression)
        {
            this.Expression = expression;
        }
        public static Node CreateApplication2(Node a, Node b)
        {
            return new Application(new Node[] { a, b }).AsNode();
        }
        public static Node CreateApplication3(Node a, Node b, Node c)
        {
            return new Application(new Node[] { a, b, c }).AsNode();
        }
        public static Node CreateApplication4(Node a, Node b, Node c, Node d)
        {
            return new Application(new Node[] { a, b, c, d }).AsNode();
        }
        public static Node CreateApplication5(Node a, Node b, Node c, Node d, Node e)
        {
            return new Application(new Node[] { a, b, c, d, e }).AsNode();
        }
        public static Node CreateApplication(Node[] nodes)
        {
            return new Application(nodes).AsNode();
        }

        Expression _value;
        public Expression Expression { get { return _value; } private set { _value = value; } }

        public bool Reducible
        {
            get
            {
                return Expression == null ? false : Expression.Reducible;
            }
        }
        public Node GetReducedForm()
        {
            Reduce();
            return this;
        }



        public static int report1;
        public static int report2;


        static Stack<List<Node>> cache = new Stack<List<Node>>();
        static List<Node> getEmpty()
        {
            if (cache.Count == 0)
                return new List<Node>();
            else
                return cache.Pop();
        }
        static void giveEmpty(List<Node> list)
        {
            list.Clear();
            cache.Push(list);
        }

        public void Reduce()
        {
            //if (Reducible)
            //{
            //    var split = Expression as Application;
            //    split.A.Reduce();
            //    var result = split.A.Expression.Call(split.B);
            //    result.Reduce();
            //    Expression = result.Expression;
            //}

            //return;

            report2++;

            Stack<Node> todo = new Stack<Node>();
            Stack<List<Node>> writeBack = new Stack<List<Node>>();
            writeBack.Push(getEmpty());
            todo.Push(this);
            while (true)
            {
                var top = todo.Pop();
                var topApp = top.Expression as Application;
                if (topApp != null)
                {
                    writeBack.Peek().Add(top);

                    report1++;

                    if (!topApp.A.Reducible)
                        todo.Push(topApp.A.Expression.Call(topApp.B));
                    else
                    {
                        todo.Push(topApp.B);
                        todo.Push(topApp.A);
                        writeBack.Push(getEmpty());
                    }
                }
                else
                {
                    foreach (var target in writeBack.Peek())
                        target.Expression = top.Expression;
                    giveEmpty(writeBack.Pop());

                    if (todo.Count == 0)
                        return;
                    if (top.Expression != I.Instance.Expression)
                    {
                        var b = todo.Pop();
                        var result = top.Expression.Call(b);
                        todo.Push(result);
                    }
                }
            }
        }


        public bool EqualsX(Node obj)
        {
            return obj != null && obj.Expression == Expression;
        }


        string machineState = null;

        public string MachineState
        {
            set
            {
                machineState = machineState ?? value;
            }
            get
            {
                return machineState ?? Expression.MachineState;
            }
        }

        public override string ToString()
        {
            return MachineState;
        }

        public void Boost(Node alternative)
        {
            //Debug.WriteLine("Boosting {" + this + "} with {" + alternative + "}");
            alternative.Reduce();
            Expression = alternative.Expression;
            MachineState = alternative.MachineState;
        }
    }

}
