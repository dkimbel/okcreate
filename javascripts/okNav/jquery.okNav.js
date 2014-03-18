/**
 * jquery.okNav.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 03/17/14
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
      history               : true,             // Whether selecting nav items changes the location hash. If false the hash will not change
      scroll                : true,             // False to disable, true to get the default (jumping) or an object of options to pass to the scrollto plugin
                                                // plugin (https://github.com/balupton/jquery-scrollto) to smoothly scroll to the target element
      activeClass           : 'active',         // className given to the currently active item
      combine               : false,            // Whether passing multiple containers will be treated as separate tab interfaces or one large interface
      linkSelector          : 'a',              // How we grab target links from within the container
      activeElementSelector : 'li',             // Which element receives the active class
      autoActivate          : true,             // Certain UIs use this to determine whether an element should activated if no elements are currently activated on ui init (only applicable to tabs)
      afterSetup            : function(){},     // Called after the plugin has bound to each tabbed interface
      afterSelect           : function(){}      // Called whenever a item is activated
    }, opts);

    function ui(opts){
      if (!$.fn.okNav.ui[opts.ui]) throw("No such ui '"+opts.ui+"'"); // Fail early since we don't know what to do
      return $.fn.okNav.ui[opts.ui];
    }

    function select(e, self, links, targets, opts) {
      var hash     = self.attr('href').split('#')[1] || '',
          href     = '#' + hash,
          pathname = self[0].pathname,
          cleanup  = function(){
            if (opts.history) w.location.hash = hash;
            if (!opts.scroll) target.attr('id', hash);
          },
          target;

      // http://blogs.msdn.com/b/ieinternals/archive/2011/02/28/internet-explorer-window-location-pathname-missing-slash-and-host-has-port.aspx
      if (pathname[0] != '/') pathname = '/' + pathname;

      // Fail if we don't have a hash, or the link is not in page
      if (!hash || pathname.indexOf(window.location.pathname) !== 0) return true;

      e.preventDefault();

      target = $(href);
  
      if (ui(opts).select) {
        targets.stop();
        ui(opts).select(target, links, targets, opts);
      }

      // Remove the target id so the page doesn't scroll
      // TODO Shouldn't use this, because it will mess with CSS
      if (!opts.scroll) target.attr('id', '');

      // Smoothly scroll to the target element when passed an object. Requires https://github.com/balupton/jquery-scrollto
      if ($.isPlainObject(opts.scroll)) target.ScrollTo($.extend({ callback: cleanup }, opts.scroll));

      if (!opts.scroll) cleanup();

      opts.afterSelect.call(self[0]);
    }

    function setup(self){
      var links   = $(opts.linkSelector, self),
          targets = links.map(function(){
            var self   = $(this),
                href   = '#' + ((self.data('target') || self.attr('href')).split('#')[1] || ''),
                target = /^#\w/.test(href) && $(href);

            return target && target.length ? target[0] : null;
          }),
          active = $("." + opts.activeClass, self);

      ui(opts).setup.call(self, active, links, targets, opts);

      self.on(opts.event + '.okNav', opts.linkSelector, function(e){
        select(e,$(this), links, targets, opts);
      });
    
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
        refresh:function(str){
          var self = $(this);

          if (str) opts.ui = str;

          self.add(self.find('*')).off('.okNav'); // Remove all events

          if (str !== false) setup(self);
        }
      });
  };
  
})(jQuery,this);
