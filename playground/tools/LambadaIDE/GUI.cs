using LambadaIDE.Basic;
using LightModel;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace LambadaIDE
{
    public partial class GUI : Form
    {
        string nativePrelude;

        public GUI()
        {
            InitializeComponent();

            nativePrelude = File.ReadAllText("prelude.native.txt");
            richTextBox2.Text = File.ReadAllText("prelude.txt");

            Init();
        }

        private void Init()
        {
            rt = new Runtime(nativePrelude);
        }

        Runtime rt;

        private void button1_Click(object sender, EventArgs e)
        {
            try
            {
                MessageBox.Show("RESULT = " + rt.Eval(richTextBox1.Text).Expression);
            }
            catch
            {
                MessageBox.Show("Runtime error", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void button2_Click(object sender, EventArgs e)
        {
            File.WriteAllText("prelude.new.txt", richTextBox2.Text);

            StringBuilder result = new StringBuilder();
            Stopwatch sw = Stopwatch.StartNew();

            List<string> logicalLines = new List<string>();
            foreach (var line in richTextBox2.Text.Split('\n'))
            {
                string adjusted = line.TrimEnd().Split('\'').First() + " "; // as long as line concatenation is not handled by lambada itself...
                if (string.IsNullOrEmpty(adjusted))
                    continue;
                if (char.IsWhiteSpace(adjusted.First()) && logicalLines.Count != 0)
                    logicalLines[logicalLines.Count - 1] += adjusted;
                else
                    logicalLines.Add(adjusted);
            }
            progressBar1.Value = 0;
            progressBar1.Maximum = logicalLines.Count;

            foreach(var line in logicalLines)
            {
                progressBar1.Value++;
                Text = line;
                Console.WriteLine(line);
                System.Windows.Forms.Application.DoEvents();
                result.Append(rt.CompileDown(line));
            }


            progressBar1.Value = 0;
            sw.Stop();
            nativePrelude = result.ToString();
            File.WriteAllText("prelude.new.native.txt", nativePrelude);

            Init();

            MessageBox.Show(sw.ElapsedMilliseconds + "ms");
            Text = "";
        }

        //Style StyleComment = new TextStyle(Brushes.Green, null, FontStyle.Italic);
        //Style StyleConstS = new TextStyle(Brushes.Salmon, null, FontStyle.Regular);
        //Style StyleConstN = new TextStyle(Brushes.CornflowerBlue, null, FontStyle.Regular);
        //Style StyleSyntax = new TextStyle(Brushes.DimGray, null, FontStyle.Regular);
        //Style StyleAbstraction = new TextStyle(Brushes.Yellow, null, FontStyle.Regular);
        //Style StyleSame = new TextStyle(Brushes.Red, Brushes.Black, FontStyle.Regular);
        //Style StyleSameAbstr = new TextStyle(Brushes.Orange, Brushes.Black, FontStyle.Regular);

        //string bound = @"\b"; 
        //private void richTextBox2_TextChanged(object sender, TextChangedEventArgs e)
        //{

        //    e.ChangedRange.ClearStyle(StyleComment);
        //    e.ChangedRange.SetStyle(StyleComment, @"\'.*$", RegexOptions.Multiline);

        //    e.ChangedRange.ClearStyle(StyleConstS);
        //    e.ChangedRange.SetStyle(StyleConstS, "\\\"[^\\\"]*\\\"", RegexOptions.Multiline);

        //    e.ChangedRange.ClearStyle(StyleConstN);
        //    e.ChangedRange.SetStyle(StyleConstN, bound + @"[0-9]+" + bound, RegexOptions.Multiline);

        //    e.ChangedRange.ClearStyle(StyleSyntax);
        //    e.ChangedRange.SetStyle(StyleSyntax, @"\(", RegexOptions.Multiline);
        //    e.ChangedRange.SetStyle(StyleSyntax, @"\)", RegexOptions.Multiline);
        //    e.ChangedRange.SetStyle(StyleSyntax, @"\=", RegexOptions.Multiline);

        //    //richTextBox2.Range.ClearStyle(StyleAbstraction);
        //    //richTextBox2.Range.SetStyle(StyleAbstraction, @"\\[a-zA-Z][a-zA-Z0-9]*" + bound, RegexOptions.Multiline);

        //    //e.ChangedRange.ClearFoldingMarkers();
        //    //e.ChangedRange.SetFoldingMarkers("\\(", "\\)", RegexOptions.);
        //}

        //private void richTextBox2_SelectionChangedDelayed(object sender, EventArgs e)
        //{
        //    richTextBox2.Range.ClearStyle(StyleSame);
        //    richTextBox2.Range.ClearStyle(StyleSameAbstr);

        //    // same words
        //    if (!richTextBox2.Selection.IsEmpty)
        //        return;
        //    //get fragment around caret
        //    var fragment = richTextBox2.Selection.GetFragment(@"\w");
        //    string text = fragment.Text;
        //    if (text.Length == 0)
        //        return;


        //    richTextBox2.Range.ClearStyle(StyleAbstraction);

        //    //highlight same words
        //    foreach (var r in richTextBox2.VisibleRange.GetRanges("\\\\" + text + "\\b"))
        //        r.SetStyle(StyleSameAbstr);
        //    foreach (var r in richTextBox2.VisibleRange.GetRanges("\\b" + text + "\\b"))
        //        r.SetStyle(StyleSame);

        //    richTextBox2.Range.SetStyle(StyleAbstraction, @"\\[a-zA-Z][a-zA-Z0-9]*" + bound, RegexOptions.Multiline);
        //}

        private void Form1_Click(object sender, EventArgs e)
        {
        }
    }
}
