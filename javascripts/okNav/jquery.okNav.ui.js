/**
 * jquery.okNav.ui.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 08/12/13
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
    $("a[href$=#"+target.attr('id')+"]")
      .closest(opts.activeElementSelector)
      .addClass(opts.activeClass)
      .siblings()
      .removeClass(opts.activeClass);
    return target;
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
        if (active.length === 0) active = $("a:first", this).closest(opts.activeElementSelector);

        active.addClass(opts.activeClass);

        targets.filter(':not('+(active.is("a") ? active : active.find("a")).attr('href')+')').hide();
      },
      select: function(target, links, targets, opts){
        activate(target,opts);
        // Show tab content and add active class
        targets.not(target)[opts.out.effect || 'hide'](opts.out).removeClass(opts.activeClass);
        target[opts['in'].effect || 'fadeIn'](opts['in']).addClass(opts.activeClass);
      }
    },
    scrollspy: {
      setup: function(unused, links, targets, opts){
        opts = $.extend({
          element: w,
          offset: 10,
          scroll: false
        }, opts);

        var element      = $(opts.element),
            isWin        = element[0] == w ,
            offsetMethod = isWin ? 'offset' : 'position', 
            offsets      = [], 
            u            = $.fn.okNav.ui.scrollspy.update,
            active       = $('');

        // Sort the targets by their offset and store for later
        targets
          .map(function(){ return $(this)[offsetMethod]().top + (!isWin && element.scrollTop()); })
          .sort(function(a, b){ return a - b; })
          .each(function(i, v){ offsets.push(v); });

        // Set active nav element based on current scroll position
        u(active, element, offsets, targets, opts);

        // Update active on scroll
        element.on('scroll.okNav', function(){
          active = u(active, element, offsets, targets, opts);
        });
      },
      // So the scrolling is independent of the selecting
      update: function(active, element, offsets, targets, opts){
        var scrollTop    = element.scrollTop() + opts.offset,
            scrollHeight = element[0].scrollHeight || $('body')[0].scrollHeight,
            maxScroll    = scrollHeight - element.height(),
            i;

        if (scrollTop >= maxScroll) return active[0] != (i = targets.last()) && activate(i,opts);

        for (i = offsets.length; i--;) {
          active[0] != targets[i] && 
          scrollTop >= offsets[i] && 
          (!offsets[i + 1] || scrollTop <= offsets[i + 1]) &&
          (active = activate(targets.eq(i), opts));
        }

        return active;
      }
    },
    accordian: {
      setup: function(active,links,targets,opts){
        if (opts.exclusive === undefined) opts.exclusive = true;
        if (!opts.startExpanded) (active.length ? targets.filter(':not('+(active.is("a") ? active : active.find("a")).attr('href')+')') : targets).hide();
      },
      select: function(target, links, targets, opts){
        var vis = target.is(":visible");

        if (opts.exclusive) targets.not(target).slideUp(opts).add(links.closest(opts.activeElementSelector)).removeClass(opts.activeClass);

        target[vis ? (opts.out.effect || 'slideUp') : (opts['in'].effect || 'slideDown') ](opts.vis ? opts.out : opts['in'])
          .add($("a[href=#"+target.attr('id')+"]")
          .closest(opts.activeElementSelector))[vis ? 'removeClass' : 'addClass'](opts.activeClass);
      }
    },
    selectNav: {
      setup: function(active, links, targets, opts) {
        opts = $.extend({
          activeClass  : 'active',          // ClassName given to the currently item
          enabledClass : 'js-enabled',      // ClassName added to the html element once the UI has initialized
          navClass     : 'selectNav',       // Class added to the generated select
          autoSelect   : true,              // Whether or not the select should be refreshed with the current page on init
          allowNested  : true,              // If we want to recurse into child nodes
          indent       : "&nbsp;",          // Character used to create indentation on nested links
          label        : "- Navigation -",  // Label for a 'no selection' option
          filter       : "*",               // Only use links that match the given selector
          onChange     : function(e){       // Bound to when a select option is selected
            var selected = $("option:selected", this), 
                value    = selected.val();

            if (value && $.trim(value) !== "") {
              if (value[0] == '#') { // in page link, just click the original element
                $("a[href='"+value+"']").click();
              } else {
                window.location.href = value; 
              }
            }
          }
        }, opts);

        var level = 0;

        function option(html, value, selected) {
          return html ? '<option value="' + value + '" ' + (selected ? "selected='selected'" : '') + '>' + html +'</option>' : '';
        }

        function parse(list){
          var children = $(list).children(),
              html     = '',
              prefix   = '',
              k        = level++;

          // No children, nothing to do
          if (!children.length) return;

          // Create indentation
          if (k) {
            while(k--) prefix += opts.indent;
            prefix += ' ';
          }

          children.each(function(){
            var link = $(this).find('a').filter(opts.filter),
                selected;

            if (link.length) {
              selected = link.add(link.parent()).is(opts.activeClass);

              if (opts.autoSelect && !selected){
                selected = link[0].href === document.URL;
              }

              html += option(prefix + link.html(), link.attr('href'), selected);

              if (opts.allowNested){
                link.parent().find("ul, ol").each(function(){ html += parse(this); });
              }
            }
          });

          level--;

          return html;
        }

        // Add the enabledClass to <html> tag
        $("html").addClass(opts.enabledClass);

        return this.each(function(){
          // Build the navigation and bind events
           $("<select />").addClass(opts.navClass).html(option(opts.label) + parse(this))
            .insertAfter(this)
            .on('change.okNav', opts.onChange).wrap("<div class='"+opts.navClass+"-container'></div>");
        });
      }
    }
  };
  
})(jQuery,this);
