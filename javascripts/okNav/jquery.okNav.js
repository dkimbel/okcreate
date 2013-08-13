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
      preventScroll         : true,             // True to disable, false to get jumping or an object of options to pass the scrollto 
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

    function select(self, links, targets, opts) {
      var href    = self.attr('href'),
          hash    = href.replace(/^#/, ''),
          target  = $(href);
  
      if (ui(opts).select) ui(opts).select(target, links, targets, opts);

      // Remove the target id so the page doesn't scroll
      if (opts.preventScroll) target.attr('id', '');

      // Smoothly scroll to the target element when passed an object. Requires https://github.com/balupton/jquery-scrollto
      if ($.isPlainObject(opts.preventScroll)) target.ScrollTo(opts.preventScroll);

      if (opts.replaceHistory) {
        w.location.replace(('' + w.location).split('#')[0] + href);
      } else {
        w.location.hash = hash;
      }

      if (opts.preventScroll) target.attr('id', hash);

      opts.afterSelect.call(self[0]);
    }

    function setup(self){
      var links   = $("a", self),
          targets = links.map(function(){
            var self   = $(this),
                href   = self.data('target') || self.attr('href'),
                target = /^#\w/.test(href) && $(href);
            return target && target[0];
          }),
          active = $("." + opts.activeClass, self);

      ui(opts).setup.call(self, active, links, targets, opts);

      self.on(opts.event + '.okNav', 'a', function(e){ 
        e.preventDefault(); 
        select($(this), links, targets, opts); 
      });
    
      opts.afterSetup.call(self[0]);
    }

    return this
      .each(function(){ setup($(this)); })
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
