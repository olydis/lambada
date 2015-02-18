using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace LambadaIDE
{
    public partial class CodeEditor : UserControl
    {
        public CodeEditor()
        {
            InitializeComponent();
        }

        [Browsable(true)]
        public override string Text
        {
            get
            {
                return textBoxText.Text;
            }
            set
            {
                textBoxText.Text = value;
                updateNumberLabel();
            }
        }

        private void updateNumberLabel()
        {
            int firstIndex = textBoxText.GetCharIndexFromPosition(Point.Empty);
            int firstLine = textBoxText.GetLineFromCharIndex(firstIndex);

            int lastIndex = textBoxText.GetCharIndexFromPosition(new Point(textBoxText.ClientSize));
            int lastLine = textBoxText.GetLineFromCharIndex(lastIndex);

            StringBuilder builder = new StringBuilder();
            for (int i = firstLine; i <= lastLine + 1; i++)
            {
                builder.Append(i + 1);
                builder.AppendLine();
            }
            labelLineNumbers.Text = builder.ToString();
        }

        private void textBoxText_Scroll()
        {
            //int d = textBoxText.GetPositionFromCharIndex(0).Y % (textBoxText.Font.Height + 1);
            //labelLineNumbers.Location = new Point(0, d);

            updateNumberLabel();
        }

        private void textBoxText_TextChanged(object sender, EventArgs e)
        {
            updateNumberLabel();
        }

        private void textBoxText_KeyPress(object sender, KeyPressEventArgs e)
        {
        }
    }

    public class TextBoxX : TextBox
    {
        public event Action Scroll;

        private const int WM_HSCROLL = 0x114;
        private const int WM_VSCROLL = 0x115;
        private const int WM_MOUSEWHEEL = 0x20A;

        protected override void WndProc(ref Message m)
        {
            base.WndProc(ref m);

            if (m.Msg == WM_VSCROLL || m.Msg == WM_HSCROLL || m.Msg == WM_MOUSEWHEEL)
                if (Scroll != null)
                    Scroll();
        }
    }
}