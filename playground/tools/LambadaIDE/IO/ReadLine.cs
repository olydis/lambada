using System;
using System.Collections.Generic;
using System.Linq;
using LambadaRuntime.Basic;

namespace LambadaRuntime.BuiltIn
{
    public static class ReadLine
    {
        public static readonly Node Instance = new IOReturnValue("readLine", () => { return StringX.FromString(Console.ReadLine()); }).AsNode();
    }
}
