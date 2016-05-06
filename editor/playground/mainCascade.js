// 
var templateApplication = "<div class=\"cApplication\">"+
                          "<div class=\"cApplicationMethod\">"+
                          "<span class=\"cSpace\">&nbsp;</span>"+
                          "</div>"+
                          "<div class=\"cApplicationArgument\">"+
                          "<span class=\"cSpace\">&nbsp;</span>"+
                          "</div>";
                          
var templateAbstraction = "<div class=\"cAbstraction\">"+
                          "<div class=\"cAbstractionVariable\">"+
                          "<span class=\"cLiteralSpace\">&nbsp;</span>"+
                          "</div>"+
                          "<div class=\"cAbstractionBody\">"+
                          "<span class=\"cSpace\">&nbsp;</span>"+
                          "</div>";

function getExpression(container)
{
  var child = container.children("").first();
  if (child.hasClass("cLiteral") || child.hasClass("cLiteralSource"))
    return child.text();
  if (child.hasClass("cAbstraction"))
    return "("+getExpression(child.children(".cAbstractionVariable")) + " -> " + getExpression(child.children(".cAbstractionBody"))+")";
  if (child.hasClass("cApplication"))
    return "("+getExpression(child.children(".cApplicationMethod")) + " " + getExpression(child.children(".cApplicationArgument"))+")";
  return "?";
}
//

var state;
function setState(newState)
{
  //debug
  document.title = newState.id;
  $(".debug").text(getExpression($(".cNode"))); 
  
  if (state && state.leave)
    state.leave();
  state = newState;
  state.enter();
}
var sDefault, sDraggingBlock, sDraggingLiteral;

sDefault =
{
  id: "default",
  enter: function()
  {
    $("*").removeClass("dragging");
    $(".cLiteral").draggable({ 
      revert: "invalid",
      start: function() { if (state == sDefault) { $(this).addClass("dragging"); setState(sDraggingLiteral); }  },
      stop: function() { setState(sDefault); }
    });
    $(".cLiteralSource").draggable({ 
      helper: "clone",
      revert: "invalid",
      start: function(event, ui) 
      { 
        if (state == sDefault) 
        { 
          /*ui.helper.removeClass("cLiteralSource"); 
          ui.helper.addClass("cLiteral"); 
          ui.helper.addClass("dragging"); */
          
          $(this).addClass("cLiteral");
          ui.helper.addClass("dragging");
         
          setState(sDraggingLiteral); 
        }  
      },
      stop: function() 
      { 
        $(this).removeClass("cLiteral");
        setState(sDefault); 
      }
    });
    $(".cApplication, .cAbstraction").draggable({ 
      revert: "invalid",
      start: function() { if (state == sDefault) { $(this).addClass("dragging"); setState(sDraggingBlock); } },
      stop: function() { setState(sDefault); }
    });
  },
  leave: function()
  {
  },
  hover: function(block, literal)
  {
    $("*").removeClass("cAbstractionHover"); 
    $("*").removeClass("cApplicationHover"); 
    $("*").removeClass("cLiteralHover"); 
    $("*").removeClass("cInnerHover"); 
    
    block.filter(".cAbstraction").addClass("cAbstractionHover");
    block.filter(".cApplication").addClass("cApplicationHover");
    block.filter(".cAbstraction").children().addClass("cInnerHover");
    block.filter(".cApplication").children().addClass("cInnerHover");
    
    $(".lit" + literal.html()).addClass("cLiteralHover");
  }
};
sDraggingBlock =
{
  id: "draggingBlock",
  enter: function()
  {
    $(".cSpace").droppable({
        accept: ".cApplication, .cCreateApplication, .cAbstraction, .cCreateAbstraction",
        tolerance: "pointer",
        hoverClass: "cSpaceHover",
        drop: function( event, ui ) { if(state == sDraggingBlock) { drop(ui.draggable, $(this)); } }
      });
  },
  leave: function()
  {
  },
  hover: function(block, literal)
  {
  }
};
sDraggingLiteral =
{
  id: "draggingLiteral",
  enter: function()
  {
    $(".cLiteralSpace, .cSpace").droppable({
        accept: ".cLiteral",
        tolerance: "pointer",
        hoverClass: "cSpaceHover",
        drop: function( event, ui ) { if(state == sDraggingLiteral) { drop(ui.draggable, $(this)); } }
      });
  },
  leave: function()
  {
  },
  hover: function(block, literal)
  {
    
  }
};


$(function() 
{
  setState(sDefault);
  
  $(".cCreateAbstraction, .cCreateApplication").draggable({ 
      helper: "clone",
      revert: "invalid",
      start: function(event, ui) { if (state == sDefault) { /*ui.helper.replaceWith(templateAbstraction);*/ setState(sDraggingBlock); } },
      stop: function() { setState(sDefault); }
    });
  
  $(".cTrash").droppable({
      accept: ".cLiteral, .cApplication, .cAbstraction",
      tolerance: "pointer",
      hoverClass: "cTrashHover",
      drop: function( event, ui ) { drop(ui.draggable, $(".cTrash")); }
    });
      
  $("body").mousemove(function() 
  { 
    state.hover(
      $(this).find(".cAbstraction:hover, .cApplication:hover").last(),
      $(this).find(".cLiteral:hover, .cLiteralSource:hover").last()
      ) 
  });
});

function remove(what)
{
  if (what.parent().hasClass("cAbstractionVariable"))
    what.replaceWith("<span class=\"cLiteralSpace\">&nbsp;</span>");
  else
    what.replaceWith("<span class=\"cSpace\">&nbsp;</span>"); 
}
function drop(what, where)
{
  // special: create abstraction
  if (what.hasClass("cCreateAbstraction"))
  {
    where.replaceWith(templateAbstraction);
    return;
  }
  // special: create application
  if (what.hasClass("cCreateApplication"))
  {
    where.replaceWith(templateApplication);
    return;
  }
  
  // special: create literal
  if (what.hasClass("cLiteralSource"))
  {
    what = what.clone();
    what.removeClass("cLiteralSource");
  }
  
  // create space at drag source if it makes sense
  remove(what);
  
  // replace drag target with drag source
  if (!where.hasClass("cTrash"))
  {
    where.replaceWith(what);
    what.css({ 'top': '', 'left': '' });
  }
  
  setState(sDefault);
}
