using System;
using System.Collections.Generic;
using System.Linq;

namespace LightModel
{
    public static class ReadLine
    {
        public static readonly Node Instance = new IOReturnValue(() => { return StringX.FromString(Console.ReadLine()); }).AsNode();
    }
}
