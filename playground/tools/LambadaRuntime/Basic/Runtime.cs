using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using LambadaRuntime.Basic;
using LambadaRuntime.BuiltIn;

namespace LambadaRuntime.Basic
{
    public class Runtime
    {
        CombinatorEnvironment env;

        public void Boost(string ind, Node alternative)
        {
            env.Boost(ind, alternative);
        }
        public void Boost(Node alternative)
        {
            env.Boost(alternative.MachineState, alternative);
        }

        void envOverride()
        {
            Boost("_builtin_", new Abstraction("_builtin_", x => { Debug.WriteLine("RAN _builtin_!!!"); return x; }).AsNode());

            // EXTERN
            Boost(U.Instance);


            Boost(S.Instance);
            Boost(K.Instance);
            Boost(I.Instance);
            Boost(B.Instance);
            Boost(C.Instance);

            Boost(Y.Instance);

            // WRONG because they make assumptions on datatype
            Boost("Zero", NatNumber.Get(0));

            Boost(Succ.Instance);
            Boost(Pred.Instance);
            Boost(Add.Instance);
            Boost(Mul.Instance);
            Boost(Pow.Instance);
            Boost(Sub.Instance);
            Boost(Mod.Instance);
            Boost(Div.Instance);
            Boost(Xor.Instance);

            Boost(Fst.Instance);
            Boost(Snd.Instance);
            Boost(MakePair.Instance);

            Boost(Bool.TrueX);
            Boost(Bool.FalseX);
            Boost(Not.Instance);
            Boost(And.Instance);
            Boost(Or.Instance);


            Boost("strEmpty", StringX.emptyString);
            Boost(StringIsEmpty.Instance);
            Boost(StringSkip.Instance);
            Boost(StringTake.Instance);
            Boost(StringHead.Instance);
            Boost(StringTail.Instance);

            Boost(StringAddFront.Instance);
            Boost(StringAddBack.Instance);
            Boost(StringCons.Instance);
            Boost(StringCutAt.Instance);
            Boost(StringEquals.Instance);

            Boost(StrFromN.Instance);
            Boost(StrToN.Instance);

            Boost(StringWhere.Instance);
            Boost(new Abstraction("strStartsWith", l1 => new Abstraction("strStartsWith " + l1.MachineState + ".", l2 => Bool.GetBool(StringX.ValueOfNode(l1).StartsWith(StringX.ValueOfNode(l2)))).AsNode()).AsNode());


            // causes error!
            //Boost(new Abstraction("isEQ", a => new Abstraction("isEQ " + a.MachineState + ".", b => Bool.GetBool(NatNumber.ValueOfNode(a) == NatNumber.ValueOfNode(b))).AsNode()).AsNode());
            //Boost(new Abstraction("isLT", a => new Abstraction("isLT " + a.MachineState + ".", b => Bool.GetBool(NatNumber.ValueOfNode(a) < NatNumber.ValueOfNode(b))).AsNode()).AsNode());
            //Boost(new Abstraction("isGT", a => new Abstraction("isGT " + a.MachineState + ".", b => Bool.GetBool(NatNumber.ValueOfNode(a) > NatNumber.ValueOfNode(b))).AsNode()).AsNode());
            //Boost(new Abstraction("isLTE", a => new Abstraction("isLTE " + a.MachineState + ".", b => Bool.GetBool(NatNumber.ValueOfNode(a) <= NatNumber.ValueOfNode(b))).AsNode()).AsNode());
            //Boost(new Abstraction("isGTE", a => new Abstraction("isGTE " + a.MachineState + ".", b => Bool.GetBool(NatNumber.ValueOfNode(a) >= NatNumber.ValueOfNode(b))).AsNode()).AsNode());
        }

        public static Runtime Create(string nativePrelude)
        {
            var rt = new Runtime(nativePrelude);
            if (!rt.RunTests())
                return rt; // TODO: null
            return rt;
        }

        private Runtime(string nativePrelude)
        {
            env = new CombinatorEnvironment();
            DateTime start = DateTime.Now;

            envOverride();

            Node.Parse(nativePrelude, env);

            envOverride();
        }

        bool RunTests()
        {
            // internal

            {
                Node d1 = Expression.CreateDummy().AsNode();
                Node d2 = Expression.CreateDummy().AsNode();

                Node k = env["k"];
                Node i = env["i"];

                Debug.Assert(d1.EqualsX(Node.CreateApplication2(env["i"], d1).GetReducedForm()), "Unexpected behaviour: I");
                Debug.Assert(d1.EqualsX(Node.CreateApplication3(env["k"], d1, d2).GetReducedForm()), "Unexpected behaviour: K");
                Debug.Assert(d1.EqualsX(Node.CreateApplication4(env["s"], k, i, d1).GetReducedForm()), "Unexpected behaviour: S");
                Debug.Assert(d1.EqualsX(Node.CreateApplication5(env["b"], k, i, d1, d2).GetReducedForm()), "Unexpected behaviour: B");
                Debug.Assert(d1.EqualsX(Node.CreateApplication4(env["c"], k, d2, d1).GetReducedForm()), "Unexpected behaviour: C");
            }

            // external
            {
                uint testCount = 0;
                try
                {
                    testCount = NatNumber.ValueOfNode(env["testCount"]);
                }
                catch
                {
                    Debug.WriteLine("no tests found");
                    return true;
                }
                for (int i = 0; i < testCount; i++)
                {
                    try
                    {
                        Debug.WriteLine("running test " + i + "...");
                        if (!Bool.ValueOfNode(env["test" + i]))
                            throw new IOException("test failed");
                    }
                    catch (IOException)
                    {
                        Debug.WriteLine("test " + i + " failed!");
                        return false;
                    }
                    catch
                    {
                        Debug.WriteLine("test " + i + " failed hard!");
                        return false;
                    }
                }
            }

            //File.WriteAllText("universe.txt", env.Dump());
            return true;
        }


        Node ParseX(string statement)
        {
            //return Node.Parse(statement);
            Node stat = StringX.FromString(statement);

            Node mapping = env.AsNode();
            Node result = Node.CreateApplication3(env["run2"], mapping, stat);
            result.Reduce();

            var hook = Expression.CreateDummy();
            result = Node.CreateApplication3(result, I.Instance, hook.AsNode());

            // if result reduces to hook there was an error

            return result;
        }
        public Node Eval(string command)
        {
            Node expression = null;
            try
            {
                Node.report1 = Node.report2 = 0;
                expression = ParseX(command);
                Debug.WriteLine("REPORT parse: " + Node.report1 + " - " + Node.report2);

                Node.report1 = Node.report2 = 0;
                //Debug.WriteLine("BEFORE: " + expression.MachineState);
                expression.Reduce();
                Debug.WriteLine("AFTER:  " + expression.MachineState);
                Debug.WriteLine("REPORT exec:  " + Node.report1 + " - " + Node.report2);
            }
            catch (Exception e) { throw new Exception("INVALID COMMAND! " + e); }

            return expression;
        }



        public string CompileDown(string command)
        {
            Node stat = StringX.FromString(command);
            Node result = Node.CreateApplication2(env["pipe"], stat);
            return StringX.ValueOfNode(result);
        }
        public string CompileDownType(string command)
        {
            Node stat = StringX.FromString(command);
            Node result = Node.CreateApplication2(env["pipeType"], stat);
            return StringX.ValueOfNode(result);
        }
    }
}
