$(function() 
{
  $("body").mousemove(
		function() 
    { 
      clearHover();
      setHover($(this).find(".cAbstraction:hover,.cApplication:hover").last());
    }
	);
  $(".cLiteral").hover(
		function() 
    { 
      $(".cLiteral").removeClass("cLiteralHover");
      $(".lit" + $(this).html()).addClass("cLiteralHover");
    },
		function() 
    { 
      $(".cLiteral").removeClass("cLiteralHover");
    }
	);
});

function setHover(currentNode)
{
  //currentNode.filter(".cAbstraction").addClass("cAbstractionHover");
  //currentNode.filter(".cApplication").addClass("cApplicationHover");
  currentNode.filter(".cAbstraction").children().addClass("cAbstractionHover");
  currentNode.filter(".cApplication").children().addClass("cApplicationHover");
}

function clearHover()
{
  $("div").removeClass("cAbstractionHover"); 
  $("div").removeClass("cApplicationHover"); 
}
