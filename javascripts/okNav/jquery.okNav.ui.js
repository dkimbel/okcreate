/**
 * jquery.okNav.ui.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 07/31/13
 *
 * @description Customizable in-page navigation
 * @author Asher Van Brunt
 * @mailto asher@okbreathe.com
 * @version 2.0 BETA
 *
 */

(function($,w) {
  "use strict";

  function activate(target, opts) {
    $("a[href=#"+target.attr('id')+"]")
      .closest(opts.activeElementSelector)
      .addClass(opts.activeClass)
      .siblings()
      .removeClass(opts.activeClass);
  }

  /*
   * A UI is encapsulated by an object with two properies: setup and select.
   * Setup is called once upon UI initialization, and select is called whenever
   * the navigation links are clicked.
   */
  $.fn.okNav.ui = {
    tabs: {
      setup: function(active, links, targets, opts){
        opts.out.duration = opts.out.duration || 0;

        // If no active element is found, use the first
        if (active.length === 0) active = $(opts.activeElementSelector+":first", this);

        active.addClass(opts.activeClass);

        targets.filter(':not('+(active.is("a") ? active : active.find("a")).attr('href')+')').hide();
      },
      select: function(target, links, targets, opts){
        activate(target,opts);
        // Show tab content and add active class
        targets.not(target)[opts.out.effect || 'hide'](opts.out).removeClass(opts.activeClass);
        target[opts.in.effect || 'fadeIn'](opts.in).addClass(opts.activeClass);
      }
    },
    scrollspy: {
      setup: function(active, links, targets, opts){
        opts.preventScroll = false;

        opts = $.extend({
          element: w,
          offset: 10
        }, opts);

        var element      = $(opts.element),
            offsetMethod = element.is(w) ? 'offset' : 'position', 
            offsets      = [], 
            u            = $.fn.okNav.ui.scrollspy.update;

        // Sort the targets by their offset and store for later
        targets
          .map(function(){ return $(this)[offsetMethod]().top + (!element.is(w) && element.scrollTop()); })
          .sort(function(a, b) { return a - b; })
          .each(function(i,v)  { offsets.push(v); });

        // Set active nav element based on current scroll position
        u(active, element, offsets, targets, opts);

        element.on('scroll.okNav', function(){
          u(active, element, offsets, targets, opts);
        });
      },
      update: function(active, element, offsets, targets, opts){
        var scrollTop    = element.scrollTop() + opts.offset,
            scrollHeight = element[0].scrollHeight || $('body')[0].scrollHeight,
            maxScroll    = scrollHeight - element.height(),
            i;

        if (scrollTop >= maxScroll) return active[0] != (i = targets.last())[0] && activate(i,opts);

        for (i = offsets.length; i--;) {
          active[0] != targets[i] && 
            scrollTop >= offsets[i] && 
            (!offsets[i + 1] || scrollTop <= offsets[i + 1]) && 
            activate(targets.eq(i), opts);
        }
      }
    },
    accordian: {
      setup: function(active,links,targets,opts){
        targets.hide();
      },
      select: function(target, links, targets, opts){
        var vis = target.is(":visible");

        targets.not(target).slideUp(opts).removeClass(opts.activeClass);

        target[vis ? (opts.out.effect || 'slideUp') : (opts.in.effect || 'slideDown') ](opts.vis ? opts.out : opts.in)
          .add($("a[href=#"+target.attr('id')+"]")
          .closest(opts.activeElementSelector))[vis ? 'removeClass' : 'addClass'](opts.activeClass);
      }
    }
  };
  
})(jQuery,this);
