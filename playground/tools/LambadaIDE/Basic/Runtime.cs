using LightModel;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace LambadaIDE.Basic
{
    public class Runtime
    {
        CombinatorEnvironment env;

        static string fromInt(int n)
        {
            return n == 0 ? "zero" : "Succ (" + fromInt(n - 1) + ")";
        }
        static string fromString(string n)
        {
            return n == "" ? "listEmpty" : "listAddFront(" + fromString(n.Substring(1)) + ")(" + fromInt(n.First()) + ")";
        }

        void envOverride()
        {
            // EXTERN
            env.Boost("u", U.Instance);
            env.Boost("write", Write.Instance);
            env.Boost("writeLine", WriteLine.Instance);
            env.Boost("readLine", ReadLine.Instance);
            env.Boost("ioBind", IOBind.Instance);
            env.Boost("ioReturn", IOReturn.Instance);
            env.Boost("msgBox", new Hook("msgBox", delegate(Node n) { n.ReduceAndShout(); }).AsNode());


            env.Boost("s", S.Instance);
            env.Boost("k", K.Instance);
            env.Boost("i", I.Instance);
            env.Boost("b", B.Instance);
            env.Boost("c", C.Instance);

            env.Boost("y", Y.Instance);

            // WRONG because they make assumptions on datatype
            env.Boost("isZero", IsZero.Instance);
            env.Boost("Zero", NatNumber.Get(0));
            env.Boost("one", NatNumber.Get(1));

            env.Boost("Succ", Succ.Instance);
            env.Boost("pred", Pred.Instance);
            env.Boost("add", Add.Instance);
            env.Boost("mul", Mul.Instance);
            env.Boost("pow", Pow.Instance);
            env.Boost("sub", Sub.Instance);
            env.Boost("mod", Mod.Instance);
            env.Boost("div", Div.Instance);
            env.Boost("xor", Xor.Instance);

            env.Boost("fst", Fst.Instance);
            env.Boost("snd", Snd.Instance);
            env.Boost("makePair", MakePair.Instance);

            env.Boost("true", Bool.TrueX);
            env.Boost("false", Bool.FalseX);
            env.Boost("not", Not.Instance);
            env.Boost("and", And.Instance);
            env.Boost("or", Or.Instance);
            

            env.Boost("strEmpty", StringX.emptyString);
            env.Boost("strIsEmpty", StringIsEmpty.Instance);
            env.Boost("strSkip", StringSkip.Instance);
            env.Boost("strTake", StringSkip.Instance);
            env.Boost("strHead", StringHead.Instance);
            env.Boost("strTail", StringTail.Instance);

            env.Boost("strAddFront", StringAddFront.Instance);
            env.Boost("strAddBack", StringAddBack.Instance);
            env.Boost("strCons", StringCons.Instance);
            env.Boost("strCutAt", StringCutAt.Instance);
            env.Boost("strEquals", StringEquals.Instance);

            env.Boost("strFromN", StrFromN.Instance);
            env.Boost("strToN", StrToN.Instance);

            env.Boost("strWhere", StringWhere.Instance);
            env.Boost("strStartsWith", new Hook("strStartsWith", l1 => new Hook("strStartsWith2", l2 => Bool.GetBool(StringX.ValueOfNode(l1).StartsWith(StringX.ValueOfNode(l2)))).AsNode()).AsNode());



            env.Boost("isEQ", new Hook("IsEQ", a => new Hook("IsEQ1", b => Bool.GetBool(NatNumber.ValueOfNode(a) == NatNumber.ValueOfNode(b))).AsNode()).AsNode());
            env.Boost("isLT", new Hook("IsLT", a => new Hook("IsLT1", b => Bool.GetBool(NatNumber.ValueOfNode(a) < NatNumber.ValueOfNode(b))).AsNode()).AsNode());
            env.Boost("isGT", new Hook("IsGT", a => new Hook("IsGT1", b => Bool.GetBool(NatNumber.ValueOfNode(a) > NatNumber.ValueOfNode(b))).AsNode()).AsNode());
            env.Boost("isLTE", new Hook("IsLTE", a => new Hook("IsLTE1", b => Bool.GetBool(NatNumber.ValueOfNode(a) <= NatNumber.ValueOfNode(b))).AsNode()).AsNode());
            env.Boost("isGTE", new Hook("IsGTE", a => new Hook("IsGTE1", b => Bool.GetBool(NatNumber.ValueOfNode(a) >= NatNumber.ValueOfNode(b))).AsNode()).AsNode());

        }

        public Runtime(string nativePrelude)
        {
            env = new CombinatorEnvironment();
            DateTime start = DateTime.Now;

            envOverride();

            Node.Parse(nativePrelude, env);

            //RunTests();
            run();
            RunTests();
        }

        void RunTests()
        {
            uint testCount = 0;
            try
            {
                testCount = NatNumber.ValueOfNode(env["testCount"]);
            }
            catch
            {
                Console.WriteLine("no tests found");
                return;
            }
            for (int i = 0; i < testCount; i++)
            {
                try
                {
                    Console.WriteLine("running test " + i + "...");
                    if (!Bool.ValueOfNode(env["test" + i]))
                        throw new IOException("test failed");
                }
                catch (IOException)
                {
                    Console.WriteLine("test " + i + " failed!");
                    return;
                }
                catch 
                {
                    Console.WriteLine("test " + i + " failed hard!");
                    return;
                }
            }

            File.WriteAllText("universe.txt", env.Dump());
        }


        Node ParseX(string statement)
        {
            //return Node.Parse(statement);
            Node stat = StringX.FromString(statement);

            stat.ReduceAndShout();

            Node mapping = env.AsNode();
            Node result = Node.CreateApplication3(env["run2"], mapping, stat);

            var hook = new Hook("hook", n => n);
            result = Node.CreateApplication3(result, I.Instance, hook.AsNode());
            result.Reduce();

            if (result.Expression == hook)
                throw new Exception("x parsing error");
            return result;
        }

        void run()
        {
            DateTime start = DateTime.Now;
            {
                envOverride();

                Node d1 = Hook.MakeDummy("d1").AsNode();
                Node d2 = Hook.MakeDummy("d2").AsNode();

                Node k = env["k"];
                Node i = env["i"];

                Debug.Assert(d1.EqualsX(Node.CreateApplication2(env["i"], d1).GetReducedForm()), "Unexpected behaviour: I");
                Debug.Assert(d1.EqualsX(Node.CreateApplication3(env["k"], d1, d2).GetReducedForm()), "Unexpected behaviour: K");
                Debug.Assert(d1.EqualsX(Node.CreateApplication4(env["s"], k, i, d1).GetReducedForm()), "Unexpected behaviour: S");
                Debug.Assert(d1.EqualsX(Node.CreateApplication5(env["b"], k, i, d1, d2).GetReducedForm()), "Unexpected behaviour: B");
                Debug.Assert(d1.EqualsX(Node.CreateApplication4(env["c"], k, d2, d1).GetReducedForm()), "Unexpected behaviour: C");
            }
        }


        void MakeReport(string type)
        {
            string message = "#calls: " + Node.report1 + " with depth " + Node.report2;
            message += "\n---";
            message += "\n" + string.Join(
               "\n",
               Node.report
                   .OrderByDescending(kvp => kvp.Value)
                   //.Take(10)
                   .Select(kvp => kvp.Value + "\t" + kvp.Key));
            //message += "\n---";
            //message += "\n" + string.Join(
            //   "\n",
            //   Node.report
            //       .OrderBy(kvp => kvp.Value)
            //       .Take(10)
            //       .Select(kvp => kvp.Value + "\t" + kvp.Key));

            //message = Node.report.ContainsKey("I") ? Node.report["I"].ToString() : "-";
            MessageBox.Show(message, type, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        public Node Eval(string command)
        {
            Node expression = null;
            try
            {
                Node.report.Clear();
                Node.report1 = Node.report2 = 0;
                expression = ParseX(command);
                //MakeReport("parse");

                Node.report.Clear();
                Node.report1 = Node.report2 = 0;
                expression.Reduce();
                MakeReport("exec");
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
    }
}
