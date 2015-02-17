namespace LambadaIDE
{
    partial class CodeEditor
    {
        /// <summary> 
        /// Erforderliche Designervariable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Verwendete Ressourcen bereinigen.
        /// </summary>
        /// <param name="disposing">True, wenn verwaltete Ressourcen gelöscht werden sollen; andernfalls False.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Vom Komponenten-Designer generierter Code

        /// <summary> 
        /// Erforderliche Methode für die Designerunterstützung. 
        /// Der Inhalt der Methode darf nicht mit dem Code-Editor geändert werden.
        /// </summary>
        private void InitializeComponent()
        {
            this.labelLineNumbers = new System.Windows.Forms.Label();
            this.splitter = new System.Windows.Forms.Splitter();
            this.textBoxText = new LambadaIDE.TextBoxX();
            this.SuspendLayout();
            // 
            // labelLineNumbers
            // 
            this.labelLineNumbers.BackColor = System.Drawing.Color.Black;
            this.labelLineNumbers.Dock = System.Windows.Forms.DockStyle.Left;
            this.labelLineNumbers.Font = new System.Drawing.Font("Consolas", 12F);
            this.labelLineNumbers.ForeColor = System.Drawing.Color.Gray;
            this.labelLineNumbers.Location = new System.Drawing.Point(0, 0);
            this.labelLineNumbers.Name = "labelLineNumbers";
            this.labelLineNumbers.Size = new System.Drawing.Size(47, 510);
            this.labelLineNumbers.TabIndex = 0;
            this.labelLineNumbers.Text = "1\r\n2\r\n3\r\n4\r\n";
            this.labelLineNumbers.TextAlign = System.Drawing.ContentAlignment.TopRight;
            this.labelLineNumbers.UseMnemonic = false;
            // 
            // splitter
            // 
            this.splitter.Location = new System.Drawing.Point(47, 0);
            this.splitter.Name = "splitter";
            this.splitter.Size = new System.Drawing.Size(5, 510);
            this.splitter.TabIndex = 2;
            this.splitter.TabStop = false;
            // 
            // textBoxText
            // 
            this.textBoxText.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(25)))), ((int)(((byte)(25)))), ((int)(((byte)(25)))));
            this.textBoxText.BorderStyle = System.Windows.Forms.BorderStyle.None;
            this.textBoxText.Dock = System.Windows.Forms.DockStyle.Fill;
            this.textBoxText.Font = new System.Drawing.Font("Consolas", 12F);
            this.textBoxText.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(224)))), ((int)(((byte)(224)))), ((int)(((byte)(224)))));
            this.textBoxText.Location = new System.Drawing.Point(52, 0);
            this.textBoxText.Multiline = true;
            this.textBoxText.Name = "textBoxText";
            this.textBoxText.ScrollBars = System.Windows.Forms.ScrollBars.Both;
            this.textBoxText.Size = new System.Drawing.Size(524, 510);
            this.textBoxText.TabIndex = 3;
            this.textBoxText.Text = "Hello World\r\nWhere is the pie?\r\nHello World\r\nWhere is the pie?\r\n";
            this.textBoxText.WordWrap = false;
            this.textBoxText.Scroll += new System.Action(this.textBoxText_Scroll);
            // 
            // CodeEditor
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(25)))), ((int)(((byte)(25)))), ((int)(((byte)(25)))));
            this.Controls.Add(this.textBoxText);
            this.Controls.Add(this.splitter);
            this.Controls.Add(this.labelLineNumbers);
            this.Name = "CodeEditor";
            this.Size = new System.Drawing.Size(576, 510);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label labelLineNumbers;
        private System.Windows.Forms.Splitter splitter;
        private TextBoxX textBoxText;
    }
}
