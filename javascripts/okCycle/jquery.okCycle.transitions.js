/**
 * jquery.okCycle.effects.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 08/05/13
 *
 * @description Provides transitions for okCycle
 * @author Asher Van Brunt
 * @mail asher@okbreathe.com
 * @version 2.0 BETA
 *
 */

(function($){
  'use strict';

  /**
   * Effects are objects that implement two methods: 'init' and 'move'.
   *
   * @method init called when the plugin is initally run and should setup any markup or values that are needed for functionality
   *
   * @param {Object} options the original options that the plugin was initialized with
   *
   * @method move called when transitioning between slides with an transition object. A transition object has everything a 
   *              growing boy needs to transition between slides:
   *
   * @param {DeferredObject} transition
   *
   * @param {jQuery}   [transition.from]       slide we're moving _from_
   * @param {Integer}  [transition.fromIndex]  index of the slide we're moving _from_
   * @param {jQuery}   [transition.to]         slide we're moving _to_
   * @param {Integer}  [transition.toIndex]    index of the slide we're moving _to_
   * @param {Boolean}  [transition.forward]    whether we are moving forward or backwards
   * @param {String}   [transition.easing]     Easing used for the transition
   * @param {Numeric}  [transition.speed]      Transition speed
   * @param {Function} [transition.resolve]    Resolve this transition
   *
   * The transition object is an enhanced Deferred Object with the additional above properties/methods.
   *
   * NOTE A move function MUST DO the following:
   *
   *   * Resolve the transition object by calling `transition.resolve()` at the end of your transition ( so autoplay works )
   *
   *   * Return the set of active elements (so we can load content if required)
   *
   * The move function, additionally should probably do two more things:
   *
   *   * Move the slide (duh)
   *
   *   * Give the active slide an active class.  Although okCycle.core doesn't
   *   internally use this, some of the transitions do.
   */

   // Fade and Slide transitions are identical except the property that is animated
   function standardTransition(fn) {
     return {
       init: function(slideshow,options){
         slideshow.children().css({ position:"absolute" }).eq(slideshow.data('active')).css({ zIndex:3, 'float': 'left', position: 'relative' });

         slideshow.css({ position:'relative', overflow: 'hidden' });
       },
       move: function(slideshow,transition){
         var opts = fn(slideshow,transition);

         transition.from.css({ zIndex : 2, position: 'absolute', 'float': 'none' }).removeClass('active');    

         return transition.to
          .addClass('active')
          .css($.extend({ zIndex : 3, 'float': 'left', position: 'relative' }, opts[0]))
          .animate(opts[1], transition.speed, transition.easing, function(){
            transition.from.css({ zIndex:1 }); 
            transition.resolve();
          });
       }
     };
   }

  $.extend($.okCycle, {
    // Standard Fade Transition
    fade: standardTransition(function(s,t){ return [{ opacity: 0  }, {  opacity: 1 }]; }),
    // Slide one slide on top of the other when transitioning
    slide: standardTransition(function(s,t){ return [{ left: t.forward ? s.width() : -s.width() }, { left: 0  } ]; }),
    // All children are shifted when transitioning
    scroll: {
      init: function(slideshow,options){
        slideshow.wrap("<div class='okCycle-transition-container' />")
          .css({position:'relative',width:'200%',left:0})
          .parent()
            .css({position:'relative',width: '100%', minHeight: '100%', overflow: 'hidden'});

        slideshow.children().each(function(i,v){
          $(slideshow).addClass("item-"+i);
        });

        slideshow.children().first().addClass('active');

        slideshow.children()
          .css({ position: 'relative', float: 'left', width: '50%' }).slice(1).hide();
      },
      move: function(slideshow,transition) {
        var self   = slideshow,
            diff   = transition.toIndex - transition.fromIndex, 
            prev   = slideshow.children('.active').removeClass('active'),
            active = slideshow.children().eq(diff).addClass('active').show();

        // If we're going backwards we need to set the initial offset
        if (!transition.forward ) {
          self.css({left: "-100%"});
          active.prependTo(self);
        }

        self.animate({
          left: transition.forward ? '-100%' : '0%' }, 
          transition.speed, 
          transition.easing, 
          function(){
            self.css({left: 0}); 

            prev.hide();

            if (transition.forward) prev.appendTo(self); 

            transition.resolve();
          });

        return active;
      }
    }
  });

})(jQuery);
