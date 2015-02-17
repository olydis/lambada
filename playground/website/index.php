<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>Lambada engine</title>
    <style type="text/css">
span, input, body, textarea, a
{
    margin: 0px;
    padding: 0px;
    font-family: monospace;
    border: none;
    color: white;
    background-color: Black;
    font-weight: bold;
}
input
{
    width: 95%;
    display: inline;

    text-shadow: 0px 0px 2px gray, 0px 0px 3px white;
}
body
{
}
p
{
    margin: 10px;
}
td
{
    vertical-align: top;
}
textarea
{
    padding: 10px;
    width: 100%;
    height: 95%;
}
h1
{
    margin: 5px;
    padding: 5px;
    font-size: large;
    color: rgb(0,0,0);
    text-decoration: none;
    display: inline;
}
a
{
    margin: -1px;
    padding: 5px;
    font-size: 12pt;
    color: rgb(255,255,255);
    text-decoration: none;
}
a.sel
{
    padding: 7px;
    color: rgb(50,200,0);
}
.hidden
{
    visibility: hidden;
    display: none;
    width: 0px;
    height: 0px;
    color: rgb(50,200,0);
}

    </style>
    <script src="mscorlib.js"></script>
    <script src="ScriptLibrary2.js"></script>
    
    <script>
        function change(mode)
        {
            document.getElementById('mode0').className = "";
            document.getElementById('mode1').className = "";
            document.getElementById('mode2').className = "";
            document.getElementById('mode3').className = "";
            document.getElementById('mode' + mode).className = "sel";
            
            if (mode == 2)
            {
                document.getElementById('stage0').className = "";
                document.getElementById('stage1').className = "hidden";
                document.getElementById('target').className = "hidden";
                document.getElementById('body').style.overflow = "hidden";
            }
            else if (mode == 3)
            {
                document.getElementById('stage0').className = "hidden";
                document.getElementById('stage1').className = "";
                document.getElementById('target').className = "hidden";
                document.getElementById('body').style.overflow = "hidden";
            }
            else
            {
                document.getElementById('stage0').className = "hidden";
                document.getElementById('stage1').className = "hidden";
                document.getElementById('target').className = "";
                document.getElementById('body').style.overflow = "auto";
            }
            if (mode == 0)
            {
                main(true);
            }
            if (mode == 1)
            {
                main(false);
            }
        }

        function main(showHelp) {

            LightModel.Program.main(showHelp);
        }
    </script>
  </head>
  <body onload='change(0)' id='body'>
      <div style="background-color: #EEE; height: 40px">
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <a href="javascript:change(1)" id="mode1">prompt only</a>
        <a href="javascript:change(0)" id="mode0">verbose startup &amp; help</a>
        <a href="javascript:change(2)" id="mode2">edit stage0</a>
        <a href="javascript:change(3)" id="mode3">edit stage1</a>
        <br />
      </div>
        
    <!-- prelude -->
    <textarea id='stage0'>
<?php
  echo trim(file_get_contents("stage0.txt"));
?>
    </textarea>
    <textarea id='stage1'>
<?php
  echo trim(file_get_contents("stage1.txt"));
?>
    </textarea>
    
    <!-- prompt -->
    <p id='target'>
    </p>
  </body>
</html>