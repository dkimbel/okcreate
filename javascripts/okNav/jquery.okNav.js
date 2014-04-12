/**
 * jquery.okNav.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 03/19/14
 *
 * @description Customizable in-page navigation
 * @author Asher Van Brunt
 * @mailto asher@okbreathe.com
 * @version 2.0 BETA
 *
 * TODO
 *
 * Hash changes should be able to change the state
 *
 */


(function($,w){
  "use strict";

  $.fn.okNav = function(opts){

    opts = $.extend({
      ui                    : 'tabs',           // Which navigation UI to use
      event                 : 'click',          // Which event will trigger a tab change
      'in'                  : { effect: null }, // Options used to define the in/out transitions. Takes standard options
      out                   : { effect: null }, // (e.g. duration, easing) in addition to an 'effect' which the other
                                                // options will be applied to in order to create the desired effect. The
                                                // default the effect is determined by the UI used. http://api.jquery.com/category/effects/
      // TODO, this doesn't actually even do anything because the plugin doesn't activate on hash change
      history               : true,             // Whether selecting nav items changes the location hash. If false the hash will not change
      scroll                : true,             // False to disable, true to get the default (jumping) or an object of options to pass to the scrollto plugin
                                                // plugin (https://github.com/balupton/jquery-scrollto) to smoothly scroll to the target element
      activeClass           : 'active',         // className given to the currently active item
      combine               : false,            // Whether passing multiple containers will be treated as separate tab interfaces or one large interface
      linkSelector          : 'a',              // How we grab target links from within the container
      activeElementSelector : 'li',             // Which element receives the active class
      afterSetup            : function(){},     // Called after the plugin has bound to each tabbed interface
      afterSelect           : function(){},     // Called whenever a item is activated
      // The following is only applicable to the tab interface
      autoActivate          : true              // Whether an element should activated if no elements have the activeClass set on init
    }, opts);

    function ui(opts){
      if (!$.fn.okNav.ui[opts.ui]) throw("No such ui '"+opts.ui+"'"); // Fail early since we don't know what to do
      return $.fn.okNav.ui[opts.ui];
    }

    function select(e, self, links, targets, opts) {
      var hash      = self.attr('href').split('#!')[1] || '',
          id        = '#' + hash,
          pathname  = self[0].pathname,
          target;

      // http://blogs.msdn.com/b/ieinternals/archive/2011/02/28/internet-explorer-window-location-pathname-missing-slash-and-host-has-port.aspx
      if (pathname[0] != '/') pathname = '/' + pathname;

      // Fail if we don't have a hash, or the link is not in page
      if (!hash || pathname.indexOf(window.location.pathname) !== 0) return true;

      target = $(id);

      if (ui(opts).select) {
        targets.stop();
        ui(opts).select(target, links, targets, opts);
      }

      if ($.isPlainObject(opts.scroll)) { // Smoothly scroll to the target element when passed an object. Requires https://github.com/balupton/jquery-scrollto
        target.ScrollTo(opts.scroll);
      } else if (opts.scroll) { // Otherwise just scroll in the standard way
        $(window).scrollTop(target.offset().top);
      }

      opts.afterSelect.call(self[0]);
    }

    // I think the solution is to do #/hash
    function setup(self){
      var links   = $(opts.linkSelector, self),
          targets = links.map(function(){
            var self   = $(this),
                href   = self.attr('href').split('#'),
                hash   = (href[1] || ''),
                target = /^\w/.test(hash) && $('#' + hash);

            // Prevent unwanted page scrolls by ensuring the link will never match an in-page element
            self.attr('href', href[0] + '#!' + hash);

            return target && target.length ? target[0] : null;
          }),
          active = $("." + opts.activeClass, self);

      ui(opts).setup.call(self, active, links, targets, opts);

      // NOTE
      // Even if an element is active on page load, we can't set the hash
      // because it's impossible to know which item is 'selected' if there are
      // multiple instances of okNav on the page
      if (opts.history) {
        if (!$.fn.okNav.history) {
          $.fn.okNav.history = [];

          $(window).on('hashchange.okNav',function(e){
            $.each($.fn.okNav.history, function(){ this(e); });
          });
        }

        $.fn.okNav.history.push(function(e){
          var selected = links.filter("[href='"+window.location.hash+"']");

          if (window.location.hash && selected.length) {
            select(e, selected, links, targets, opts);
          }
        });

        // Store the index of the history callback so we can remove it later
        self.data('okNav', $.fn.okNav.history.length);
      } else {
        self.on(opts.event + '.okNav', opts.linkSelector, function(e){
          select(e,$(this), links, targets, opts);
        });
      }
    
      opts.afterSetup.call(self[0]);

      return self;
    }

    // TODO This should be namespaced $().okNav('refresh')
    return (opts.combine ? setup($(this)) : this.each(function(){ setup($(this)); }))
      .extend({
        // Dynamically change the UI
        // Called without arguments, refreshes the current UI
        // Called with the name of a UI - changes the UI 
        // Called with false - unbinds events
        refresh:function(newUI){
          var self = $(this), idx;

          if (newUI) opts.ui = newUI;

          self.add(self.find('*')).off('.okNav'); // Remove all UI events

          // Remove hashchange event handler
          if ($.fn.okNav.history && (idx = self.data('okNav'))) {
            $.fn.okNav.history[idx] = null;
            self.removeData('okNav');
          }

          if (newUI !== false) setup(self);
        }
      });
  };
  
})(jQuery,this);
