using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Linq.Expressions;

namespace Lambada
{
    public class CombinatorEnvironment
    {
        public static CombinatorEnvironment Default = new CombinatorEnvironment();

        public CombinatorEnvironment()
        {
            library = new Dictionary<string, Combinator>();
            this["U"] = new IndependentCombinator(f => f.Call(new IndependentCombinator(x => new IndependentCombinator(y => new IndependentCombinator(z => x.Call(z).Call(y.Call(z)))))).Call(new IndependentCombinator(a => new IndependentCombinator(b => a))));
            this["null"] = new IndependentCombinator(null);
        }

        Dictionary<string, Combinator> library;

        public Combinator this[string ind]
        {
            get
            {
                if (!library.ContainsKey(ind))
                    return null;
                else
                    return library[ind];
            }
            set
            {
                library[ind] = value;
            }
        }
    }
    public static class PlatformServices
    {
        public class IntCombinator : Combinator
        {
            public static IntCombinator AsInt(Combinator x)
            {
                return x is IntCombinator ? x as IntCombinator : new IntCombinator(x);
            }

            IntCombinator(Combinator x)
            {
                int i = 0;
                x.Call(new IndependentCombinator(t => { i++; return t; })).Call(null);
                this.value = i;
            }
            IntCombinator(int x)
            {
                this.value = x;
            }

            int value;

            public override Combinator Call(Combinator argument)
            {
                return new IndependentCombinator(x =>
                {
                    for (int i = 0; i < value; i++)
                        x = argument.Call(x);
                    return x;
                });
            }

            public static Combinator Add
            {
                get
                {
                    return new IndependentCombinator(a => new IndependentCombinator(b => new IntCombinator(AsInt(a).value + AsInt(b).value)));
                }
            }
        }
    }

    public abstract class Combinator
    {
        public delegate D D(D d);

        public static implicit operator Combinator(string s)
        {
            return IndependentCombinator.Parse(CombinatorEnvironment.Default, s);
        }

        public abstract Combinator Call(Combinator argument);
    }
    public sealed class IndependentCombinator : Combinator
    {
        public IndependentCombinator(Func<Combinator, Combinator> expression)
        {
            this.expression = expression;
        }

        Func<Combinator, Combinator> expression;

        public override Combinator Call(Combinator argument)
        {
            return expression(argument);
        }


        public static Combinator Parse(CombinatorEnvironment environment, string expression)
        {
            return parseExpression(environment, new Queue<char>(expression + ")"));
        }

        static Combinator S = new IndependentCombinator(a => new IndependentCombinator(b => new IndependentCombinator(c => a.Call(c).Call(b.Call(c)))));
        static Combinator K = new IndependentCombinator(a => new IndependentCombinator(b => a));
        static Combinator I = new IndependentCombinator(x => x);
        
        static Combinator parseExpression(CombinatorEnvironment environment, Queue<char> stream)
        {
            Combinator callee = I;
            string leadingLiteral = null;

            eatWhitespace(stream);
            while (stream.Peek() != ')')
            {
                // detect basic structure
                if (stream.Peek() == '(')
                {
                    stream.Dequeue();
                    callee = callee.Call(parseExpression(environment, stream));
                    if (stream.Dequeue() != ')') throw new FormatException();
                }
                else
                    leadingLiteral = parseLiteral(stream);
                eatWhitespace(stream);

                // replace potential variable
                if (leadingLiteral != null && environment[leadingLiteral] != null)
                {
                    callee = callee.Call(environment[leadingLiteral]);
                    leadingLiteral = null;
                }

                if (leadingLiteral != null)
                    throw new FormatException();

                eatWhitespace(stream);
            }
            return callee;
        }
        static void eatWhitespace(Queue<char> stream)
        {
            while (char.IsWhiteSpace(stream.Peek()))
                stream.Dequeue();
        }
        static string parseLiteral(Queue<char> stream)
        {
            Func<char, bool> isLetter = c => char.IsLetter(c) || c == '_';
            Func<char, bool> isLetterOrDigit = c => char.IsDigit(c) || isLetter(c);

            if (!isLetter(stream.Peek()))
                throw new FormatException();

            string s = stream.Dequeue().ToString();
            while (isLetterOrDigit(stream.Peek()))
                s += stream.Dequeue();

            return s;
        }
    }
	class Program
	{
		delegate D D(D d);

        static void Main(string[] args)
        {
            Main1();
        }
        static void Main1()
        {

            // BASIC COMBINATORS

            //Expression<D> test = f => f(x => y => z => x(z)(y(z)))(a => b => a);

            CombinatorEnvironment e = CombinatorEnvironment.Default;
            Action<string, string> add = (id, code) => e[id] = IndependentCombinator.Parse(e, code);
            add("I", "U U");
            add("K", "U(U I)");
            add("S", "U K");

            add("M", "S I I");
            add("B", "S (K S) K");
            add("C", "S(S(K(S))(S(K(K))(S)))(K(K))");

            add("Y", "S(S(S(K(S))(K))(K(S(I)(I))))(S(S(K(S))(K))(K(S(I)(I))))");

            //// NUMBERS
            add("zero", "K I");
            add("one", "I");
            add("Succ", "S B");

            add("Apply", "I");
            add("Add", "S(I)(K(S(B)))");
            add("Mul", "B");
            add("Pow", "S(K(S(S(S(K)))))(K)");

            //// BOOL
            add("TRUE", "K");
            add("FALSE", "zero");
            add("IF", "I");
            add("NOT", "S (S I (K FALSE)) (K TRUE)");

            add("AND", "S S (K (K FALSE))");
            add("OR", "S I (K TRUE)");
            add("IMPLIES", "S S (K (K TRUE))");

            //// HIGHER ORDER TYPES
            ////pair
            add("makePair", "S(S(K(S))(S(K(K))(S(K(S))(S(K(S(I)))(K)))))(K(K))");
            add("fst", "S(I)(K(K))");
            add("snd", "S(I)(K(K(I)))");

            //// NUMBERS PART 2
            add("isZero", "S (S I (K (K FALSE))) (K TRUE)");
            add("Pred", "S(S(K(S))(S(K(S(K(S))))(S(S(K(S))(S(K(S(K(S))))(S(K(S(K(K))))(S(S(K(S))(K))(K(S(K(S(K(S(K(S(S(I)(K(K(I))))))(K)))))(S(S(K(S))(S(K(S(S(S(I)(K(K)))(K(I)))))(K)))(K(S(I)(K(K(I))))))))))))(K(K(S(K(S(S(I)(K(K)))))(K)))))))(K(K(K(K(I)))))");
            
            ////list
            add("listIsEmpty", "S (K NOT) fst");
            add("listIsNotEmpty", "fst");

            add("listHead", "S (K fst) snd");
            add("listTail", "S (K snd) snd");

            add("listEmpty", "makePair FALSE I");
            add("listAddFront", "S (K (S (K (makePair TRUE)))) (S (K (S makePair)) K)");


            add("listReturn", "listAddFront listEmpty");
            add("listTake", "Y(S(S(K(S))(S(K(S(K(S))))(S(K(S(S(K(S))(S(S(K(S))(S(K(S(K(IF))))(S(K(S(S(K(OR))(isZero))))(S(K(K))(listIsEmpty)))))(K(K(K(listEmpty))))))))(S(K(S(K(S(K(K))))))(S(S(K(S))(S(K(S(K(S))))(S(K(S(K(S(K(listAddFront))))))(S(S(K(S))(S(K(S(K(S))))(S(K(S(K(K))))(S(S(K(S))(K))(K(listTail))))))(K(K(Pred)))))))(K(S(K(K))(listHead))))))))(K(K(K(null)))))");


            add("foldl", "Y(S(S(K(S))(S(K(S(K(S))))(S(K(S(K(S(K(S))))))(S(S(K(S))(S(K(S(K(S))))(S(K(S(K(S(K(S))))))(S(K(S(S(K(S))(S(K(K))(S(K(S))(S(K(K))(S(K(IF))(listIsNotEmpty))))))))(S(K(S(K(S(K(S(K(K))))))))(S(S(K(S))(S(K(S(K(S))))(S(K(S(K(S(K(S))))))(S(S(K(S))(S(K(S(K(S))))(S(K(S(K(K))))(S(K(S(K(S))))(S(K(S(K(K))))(S(S(K(S))(K))(K(listTail))))))))(K(S(K(S(S(K(S))(S(K(S(I)))(K)))))(S(K(K))(S(K(K))(listHead)))))))))(K(K(K(I))))))))))(K(K(S(K(K))(K))))))))(K(K(K(K(null))))))");
            add("reverse", "S(S(foldl)(K(listEmpty)))(K(listAddFront))");
            add("foldr", "S(K(foldl))(reverse)");
            add("listCons", "S(S(K(S))(foldr))(K(K(S(K(S(K(S(K(S(S(I)(K(K)))))(K)))))(S(K(S(S(S(K(S))(S(K(K))(S(K(S))(S(K(S(I)))(K)))))(K(K)))))(K)))))");
            add("listAddBack", "S (S (K S) (S (K K) listCons)) (K listReturn)");
            add("unfold", "Y(S(S(K(S))(S(K(S(K(S))))(S(K(S(K(S(K(S))))))(S(K(S(K(S(K(S(S(I)(K(K(TRUE))))))))))(S(K(S(K(S(K(K))))))(S(K(S(K(S(K(K))))))(S(K(S(S(K(S))(S(K(K))(makePair)))))(S(S(K(S))(S(K(S(K(S))))(S(S(K(S))(S(K(K))(S(K(S))(K))))(K(S(K(S(I)))(K))))))(K(K(I)))))))))))(K(K(K(K(null))))))");

            add("listBind", "S(S(K(S))(S(K(K))(S(fold)(K(listEmpty)))))(K(S(K(S(S(K(S))(S(K(K))(listCons)))))(K)))");
            
            //// RECUSIVE

            add("halt", "Y(S(S(K(S))(S(S(K(S))(S(K(S(IF)))(K)))(K(K(I)))))(K(I)))");
            add("fak", "S(S(S(K(fold))(listTake(unfold(one)(Succ))))(K(one)))(K(Mul))");
            

            #region debug
            Combinator dummy = null;
            DateTime start = DateTime.Now;
            Action<object> _print = s => Console.WriteLine(((int)(DateTime.Now - start).TotalMilliseconds).ToString().PadRight(10) + s);
            Func<Combinator, Combinator> withFlag = n =>
            {
                Console.Write("flag ");
                return n;
            };
            Func<int, Combinator> fromInt = n =>
            {
                var number = e["zero"];
                for (int i = 0; i < n; i++)
                    number = e["Succ"].Call(number);
                return number;
            };
            Func<string, Combinator> fromString = s =>
            {
                var list = e["listEmpty"];
                foreach (char c in s)
                    list = e["listAddBack"].Call(list).Call(fromInt((int)c));
                return list;
            };
            Func<Combinator, int> toInt = n =>
            {
                int i = 0;
                n.Call(new IndependentCombinator(_ => { i++; return _; })).Call(dummy);
                return i;
            };
            Func<Combinator, bool> toBool = n =>
            {
                return n.Call(dummy).Call(n) == dummy;
            };
            Func<Combinator, string> toString = s =>
            {
                var remaining = s;

                string result = "";
                while (toBool(e["listIsNotEmpty"].Call(remaining)))
                {
                    result += (char)toInt(e["listHead"].Call(remaining));
                    remaining = e["listTail"].Call(remaining);
                }

                return result;
            };
            Func<Combinator, Combinator> printInt = n =>
            {
                _print(toInt(n));
                return n;
            };
            Func<Combinator, Combinator> printBool = n =>
            {
                _print(toBool(n));
                return n;
            };
            Func<Combinator, Combinator> printIntList = n =>
            {
                var remaining = n;

                string result = "";
                while (toBool(e["listIsNotEmpty"].Call(remaining)))
                {
                    result += toInt(e["listHead"].Call(remaining)) + " ";
                    remaining = e["listTail"].Call(remaining);
                }
                _print(result);

                return n;
            };
            Func<Combinator, Combinator> printString = n =>
            {
                _print(toString(n));
                return n;
            };
            #endregion

            var _100 = fromInt(100);
            var big = e["Mul"].Call(e["Mul"].Call(e["Mul"].Call(_100).Call(_100)).Call(_100)).Call(_100);

            printInt(big);

            /*var coordinate = makePair(_3)(_8);
            printInt(fst(coordinate));
            printInt(snd(coordinate));*/

            /*halt(FALSE);
            Console.WriteLine("Good.");
            halt(TRUE);
            Console.WriteLine("Bad.");*/

            printInt(e["fak"].Call(fromInt(10)));

            var strHello = fromString("Hello");
            var strWorld = fromString("World");
            var strGreeting = strHello;
            strGreeting = e["listCons"].Call(strGreeting).Call(fromString(" "));
            strGreeting = e["listCons"].Call(strGreeting).Call(strWorld);
            strGreeting = e["listCons"].Call(strGreeting).Call(fromString("!"));
            printString(strGreeting);
            printString(e["listTake"].Call(strGreeting).Call(fromInt(7)));
            printString(e["listBind"].Call(strGreeting).Call(e["listReturn"]));
            printString(e["listBind"].Call(strGreeting).Call(new IndependentCombinator(c => e["listReturn"].Call(e["Succ"].Call(c)))));
            printString(e["listBind"].Call(strGreeting).Call(new IndependentCombinator(c => e["listAddBack"].Call(e["listReturn"].Call(c)).Call(fromInt('-')))));

            Console.ReadLine();
        }

		static void Main2()
		{
			bool optimize = false;

			#region prelude
			D U = f => f(x => y => z => x(z)(y(z)))(a => b => a);

			D I = x => x;
			D K = a => b => a;
			D S = a => b => c => a(c)(b(c));

            D M = S(I)(I);
			D B = S(K(S))(K); // a(bc);
			D C = S(S(K(S))(S(K(K))(S)))(K(K)); // acb

            D Y = f => ((D)(x => f(v => x(x)(v))))(x => f(v => x(x)(v)));

			// NUMBERS

			D zero = K(I);
			D one = I;
			D Succ = S(B);

			D Apply = I;	// "apply (2) (1) times to (3)"
			D Add = S(I)(K(S(B))); //S(Apply)(K(Succ));
			//D Mul = S(S(K(S))(S(B)(K(S(I)(K(S(B)))))))(K(K(K(I))));
			D Mul = B;
			//D Pow = C(S(S(K)));
			D Pow = S(K(S(S(S(K)))))(K);


			// BOOL

			D TRUE = K;
			D FALSE = zero;
			D IF = I;
			D NOT = b => b(FALSE)(TRUE);

			D AND = a => b => a(b)(FALSE);
			D OR = a => b => a(TRUE)(b);
			D IMPLIES = a => b => a(b)(TRUE);


			// HIGHER ORDER TYPES
			
			//pair
			D makePair = S(S(K(S))(S(K(K))(S(K(S))(S(K(S(I)))(K)))))(K(K));
			D fst = S(I)(K(K));
			D snd = S(I)(K(K(I)));

			// NUMBERS PART 2
			D isZero = n => n(_ => FALSE)(TRUE);
			D Pred = n => f => x => snd(n((D)(pair => makePair(FALSE)(IF(fst(pair))(I)(f)(snd(pair)))))(makePair(TRUE)(x)));

			//list
			D listIsEmpty = l => NOT(fst(l));
			D listIsNotEmpty = l => fst(l);

			D listHead = l => fst(snd(l));
			D listTail = l => snd(snd(l));

			D listEmpty = makePair(FALSE)(I);
			D listAddFront = l => x => makePair(TRUE)(makePair(x)(l));

            D foldl = Y(_fold => l => x => f => IF(listIsNotEmpty(l))(_ => _fold(listTail(l))(f(x)(listHead(l)))(f))(_ => x)(null));
            D reverse = l => foldl(l)(listEmpty)(listAddFront);
            D foldr = l => foldl(reverse(l));
            D unfold = Y(_unfold => x => f => c => c(_ => TRUE)(_ => makePair(x)(_unfold(f(x))(f)))(null));

            D listCons = l => k => foldr(l)(k)(listAddFront);
                
			D listReturn = x => listAddFront(listEmpty)(x);
			D listAddBack = l => x => listCons(l)(listReturn(x));

			D listTake = Y(_take => l => n => IF(OR(isZero(n))(listIsEmpty(l)))
				(_ => listEmpty)
				(_ => listAddFront(_take(listTail(l))(Pred(n)))(listHead(l)))(null));


			D listBind = l => f => foldl(l)(listEmpty)(a => b => listCons(a)(f(b)));


			// RECUSIVE

			D halt = Y(_halt => x => IF(x)(_halt)(I)(x));
			D fak = n => foldl(listTake(unfold(one)(Succ))(n))(one)(Mul); //Y(_fak => n => IF(isZero(n))(_ => one)(m => Mul(m)(_fak(Pred(m))))(n));

			#endregion
			#region optimization

			if (optimize)
			{
				// BASIC COMBINATORS

				I = x => x;
				K = x => y => x;
				S = x => y => z => x(z)(y(z));

				B = a => b => c => a(b(c));
				C = a => b => c => a(c)(b);

				Y = S(I)(Y);


				// NUMBERS

				zero = a => I;
				one = I;
				Succ = a => b => c => b(a(b)(c));

				Apply = I;
				Add = a => a(Succ);
				Mul = B;
				//D Pow = C(S(S(K)));
				Pow = S(K(S(S(S(K)))))(K);


				// BOOL

				TRUE = K;
				FALSE = zero;
				IF = I;
				NOT = b => b(FALSE)(TRUE);

				AND = a => b => a(b)(FALSE);
				OR = a => b => a(TRUE)(b);
				IMPLIES = a => b => a(b)(TRUE);

				// CONDITIONS

				isZero = n => n(_ => FALSE)(TRUE);


				// HIGHER ORDER TYPES
				//pair
				makePair = a => b => c => c(a)(b);
				fst = a => a(K);
				snd = a => a(K(I));


				// RECUSIVE
				Pred = n => f => S(K(snd))(S(K(n((D)(pair => makePair(FALSE)(IF(fst(pair))(I)(f)(snd(pair)))))))(x => c => c(TRUE)(x)));

				halt = Y(_halt => x => IF(x)(_halt)(I)(x));
				fak = Y(_fak => n => (isZero(n))(_ => one)(m => Mul(m)(_fak(Pred(m))))(n));
			}

			#endregion

			#region debug
			D dummy = null;// x => x;
			DateTime start = DateTime.Now;
			Action<object> _print = s => Console.WriteLine(((int)(DateTime.Now - start).TotalMilliseconds).ToString().PadRight(10) + s);
			Func<D, D> withFlag = n =>
			{
				Console.Write("flag ");
				return n;
			};
			Func<int, D> fromInt = n =>
			{
				var number = zero;
				for (int i = 0; i < n; i++)
					number = Succ(number);
				return number;
			};
			Func<string, D> fromString = s =>
			{
				var list = listEmpty;
				foreach (char c in s)
					list = listAddBack(list)(fromInt((int)c));
				return list;
			};
			Func<D, int> toInt = n =>
			{
				int i = 0;
				n(_ => { i++; return _; })(dummy);
				return i;
			};
			Func<D, bool> toBool = n =>
			{
				return n(dummy)(n) == dummy;
			};
			Func<D, string> toString = s =>
			{
				var remaining = s;

				string result = "";
				while (toBool(listIsNotEmpty(remaining)))
				{
					result += (char)toInt(listHead(remaining));
					remaining = listTail(remaining);
				}

				return result;
			};
			Func<D, D> printInt = n =>
			{
				_print(toInt(n));
				return n;
			};
			Func<D, D> printBool = n =>
			{
				_print(toBool(n));
				return n;
			};
			Func<D, D> printIntList = n =>
			{
				var remaining = n;

				string result = "";
				while (toBool(listIsNotEmpty(remaining)))
				{
					result += toInt(listHead(remaining)) + " ";
					remaining = listTail(remaining);
				}
				_print(result);

				return n;
			};
			Func<D, D> printString = n =>
			{
				_print(toString(n));
				return n;
			};
			#endregion

			var _100 = fromInt(100);
			var big = Mul(Mul(Mul(_100)(_100))(_100))(_100);

			//printInt(big);

			/*var coordinate = makePair(_3)(_8);
			printInt(fst(coordinate));
			printInt(snd(coordinate));*/

			/*halt(FALSE);
			Console.WriteLine("Good.");
			halt(TRUE);
			Console.WriteLine("Bad.");*/

			printInt(fak(fromInt(10)));

			var strHello = fromString("Hello");
			var strWorld = fromString("World");
            var strGreeting = strHello;
            printString(strGreeting);
            printString(strGreeting);
            printString(strGreeting);
			strGreeting = listCons(strGreeting)(fromString(" "));
			strGreeting = listCons(strGreeting)(strWorld);
			strGreeting = listCons(strGreeting)(fromString("!"));
			printString(strGreeting);
			printString(listTake(strGreeting)(fromInt(7)));
			printString(listBind(strGreeting)(listReturn));
			printString(listBind(strGreeting)(c => listReturn(Succ(c))));
			printString(listBind(strGreeting)(c => listAddBack(listReturn(c))(fromInt('-'))));

			Console.ReadLine();
		}
	}
}
