/**
 * jquery.okCycle.ui.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 08/27/13
 *
 * @description Provides UI elements for okCycle
 * @author Asher Van Brunt
 * @mailto asher@okbreathe.com
 * @version 2.0 BETA
 *
 */

(function($){
  'use strict';

  /**
   * This follows the basic pattern set forth by the transitions package. `init` is
   * called on setup, this on move `move` is called. 
   * 
   * The only difference is that the first argument to UI functions is the UI
   * container element itself.  
   *
   * See okCycle.transitions for an explanation of the transition object.
   *
   * Notes 
   *
   * - If a UI returns a deferred, it will block the loading of subsequent UI
   *   elements until the deferred is resolved. You can use this feature if you
   *   need to wait for certain actions to complete before rendering the UI
   * 
   * - Both `init` and `move` are optional, you only need to define * them if
   *   you actually need to use them.
   *
   */

  $.okCycle.ui = {
    // Pull the data-caption attribute. 
    // If the data-caption attribute begins with an octothorpe, we will assume
    // it is referring to the id of another element somewhere on page,
    // otherwise we'll use the content directly
    caption: {
      init: function(slideshow, ui, opts){
        $.okCycle.ui.caption.setCaption(slideshow.children().eq(slideshow.data('active')),$("<div class='caption' style='z-index:4' />").appendTo(ui).hide());
      },
      // If a caption begins with a octothorpe we'll consider it an id attribute of an element containing the caption
      move: function(slideshow,ui,transition){
        $.okCycle.ui.caption.setCaption(slideshow.children('.active'), $(".caption", ui));
      },
      setCaption: function(el,container){
        var caption = el.data('caption') || '';

        caption = caption[0] == '#' ? $(caption).html() : caption;

        if (container.is(":visible")) {
          caption !== '' ?  container.html(caption) : container.fadeOut();
        } else if (caption !== ''){
          container.html(caption).fadeIn();
        }
      }
    },
    // Forward/back buttons
    navigation: {
      init: function(slideshow, ui, opts){
        var nav = $("<ul class='navigation'><li class='prev'><a href='#'>Previous</a></li><li class='next'><a href='#'>Next</a></li></ul>").appendTo(ui);

        nav.find(".prev a").click(function(e){ e.preventDefault(); $(slideshow).okCycle().prev(); });
        nav.find(".next a").click(function(e){ e.preventDefault(); $(slideshow).okCycle().next(); });
      }
    },
    // Pagination for jumping to specific slides
    pagination: {
      init: function(slideshow,ui,opts){
        var html = "<ul class='pagination'>";

        for(var i=0; i< slideshow.children().length; i++) {
          html += '<li><a href="#">'+(i+1)+'</a></li>';
        }

        // Create pagination
        $(html+"</ul>").appendTo(ui)
          .on('click', 'a', function(e){
            e.preventDefault();
            var li = $(this).parent();
            $(slideshow).okCycle().moveTo(li.siblings().andSelf().index(li));
          })
          .children().eq(slideshow.data('active')).addClass('active');
      },
      move: function(slideshow, ui, transition){
        // Just set the active class
        $(".pagination", ui).children().removeClass('active').eq(transition.toIndex).addClass('active');
      }
    },
    // Display current and total pages
    currentPage: {
      init: function(slideshow, ui, opts){
        ui.append('<ul class="current-page"><li class="current">'+(slideshow.data('active')+1)+'</li><li class="total">'+slideshow.children().length+'</li></ul>');
      },
      move: function(slideshow,ui,transition){
        $("li.current", ui).html(transition.toIndex+1);
      }
    },
		// Enable mousewheel support
    mouseWheel: {
      init: function(slideshow, ui, opts) {
        ui.mousewheel(function(e, delta)  {
          $(slideshow).okCycle()[delta < 0 ? 'next' : 'prev']();
          return false;
        });
      }
    },
    // Show pecentage of loaded images
    progress: {
      init: function(slideshow,ui,opts) {
        var api = $(slideshow).okCycle();

        ui.append("<div class='progress'><div></div></div>");

        api.progress(function(data, image){
          var width = (data.loaded / data.total) * 100;

          $(".progress > div",ui).css({width: width + '%'});
        });

        api.done(function(options){
          $(".progress", ui).fadeOut();
        });
      }
    },
    // Enable touch support
    touch: {
      init: function(slideshow,ui,opts) {
        opts = $.extend({
          vertical: false,
          threshold:  {
            x: 10,
            y: 25
          }
        },opts);

        var touch = {};
        
        slideshow[0].ontouchstart = function(e) {
          touch.x = e.touches[0].clientX;
          touch.y = e.touches[0].clientY;
        };
        
        slideshow[0].ontouchmove = function(e) {
          
          // only deal with one finger
          if (e.touches.length == 1) {
            var op     = false,
                t      = e.touches[0],
                deltaX = touch.x - t.clientX,
                deltaY = touch.y - t.clientY;

            if (deltaY < opts.threshold.y && deltaY > (opts.threshold.y*-1)) {
              if (deltaX > opts.threshold.x)      { op = 'next'; }
              if (deltaX < (opts.threshold.x*-1)) { op = 'prev'; }
            } else if (vertical && (deltaX < opts.threshold.x && deltaX > (opts.threshold.x*-1)) ) {
              if (deltaY > opts.threshold.y)      { op = 'next'; }
              if (deltaY < (opts.threshold.y*-1)) { op = 'prev'; }
            }

            if (op) {
              e.preventDefault();
              $(slideshow).okCycle()[op]();
            }
          }
        };
      
      } // init
    }
  };

})(jQuery);
