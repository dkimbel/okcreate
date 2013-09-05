/**
 * jquery.okNav.js
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

(function($,w){
  "use strict";

  $.fn.okNav = function(opts){

    opts = $.extend({
      ui                    : 'tabs',           // Which navigation UI to use
      event                 : 'click',          // Which event will trigger a tab change
      in                    : { effect: null }, // Options used to define the in/out transitions. Takes standard options
      out                   : { effect: null }, // (e.g. duration, easing) in addition to an 'effect' which the other
                                                // options will be applied to in order to create the desired effect. The
                                                // default the effect is determined by the UI used. http://api.jquery.com/category/effects/
      replaceHistory        : true,             // If false, selecting will add hashchanges to the history
      scroll                : true,             // False to disable, true to get the default (jumping) or an object of options to pass to the scrollto plugin
                                                // plugin (https://github.com/balupton/jquery-scrollto) to smoothly scroll to the target element
      activeClass           : 'active',         // className given to the currently selected tab
      activeElementSelector : 'li',             // Which element receives the active class
      afterSetup            : function(){},     // Called after the plugin has bound to each tabbed interface
      afterSelect           : function(){}      // Called whenever a tab change occurs
    }, opts);

    function ui(opts){ 
      if (!$.fn.okNav.ui[opts.ui]) throw("No such ui '"+opts.ui+"'"); // Fail early since we don't know what to do
      return $.fn.okNav.ui[opts.ui];
    }

    function select(e, self, links, targets, opts) {
      var hash = self.attr('href').split('#')[1] || '',
          href = '#' + hash,
          target;  

      // Fail if we don't have a hash, or the link is not in page
      if (!hash || self[0].pathname.indexOf(window.location.pathname) !== 0) return true;

      e.preventDefault(); 

      target = $(href);
  
      if (ui(opts).select) {
        targets.stop();
        ui(opts).select(target, links, targets, opts);
      }

      // Remove the target id so the page doesn't scroll
      if (!opts.scroll) target.attr('id', '');

      // Smoothly scroll to the target element when passed an object. Requires https://github.com/balupton/jquery-scrollto
      if ($.isPlainObject(opts.scroll)) target.ScrollTo(opts.scroll);

      if (opts.replaceHistory) {
        w.location.replace(('' + w.location).split('#')[0] + href);
      } else {
        w.location.hash = hash;
      }

      if (!opts.scroll) target.attr('id', hash);

      opts.afterSelect.call(self, links, targets, opts);
    }

    function setup(el){
      var links   = el.is('a') ? el : $('a', el),
          targets = links.map(function(){
            var self   = $(this),
                href   = '#' + ((self.data('target') || self.attr('href')).split('#')[1] || ''),
                target = /^#\w/.test(href) && $(href);

            return target && target.length ? target[0] : null;
          }),
          active = links.closest(opts.activeElementSelector).filter("." + opts.activeClass );

      ui(opts).setup.call(el, active, links, targets, opts);

      links.on(opts.event + '.okNav', function(e){ 
        select(e, $(this), links, targets, opts); 
      });
    
      opts.afterSetup.call(el, links, targets, opts);

      return links;
    }

    return (this.is('a') ? setup(this) : this.each(function(){ setup($(this)); }))
      .extend({
        // Dynamically change the UI
        // Called without arguments, refreshes the current UI
        // Called with the name of a UI - changes the UI 
        // Called with false - unbinds events
        refresh:function(str){
          if (str) opts.ui = str;

          $(this).add(opts.element).off('.okNav'); // Remove all events

          if (str !== false) setup($(this));
        }
      });
  };
  
})(jQuery,this);
