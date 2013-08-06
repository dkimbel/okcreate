/**
 * jquery.okCycle.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 08/05/13
 *
 * @description Tiny, modular, flexible slideshow
 * @author Asher Van Brunt
 * @mailto asher@okbreathe.com
 * @version 2.0 BETA
 *
 */

(function($){
  'use strict';

  // Hold meta-plugin settings
  $.okCycle = {};

  $.fn.okCycle = function(opts){
    var set = this, api;

    opts = $.extend({
      transition    : 'scroll',            // Transition used to cycle elements
      easing        : 'swing',             // Easing used by the transition
      ui            : [],                  // Any UI elements that we should build. Appended in source order
      duration      : 2000,                // Time between animations
      speed         : 300,                 // Speed the slides are transitioned between
      preload       : 1,                   // Number of images to load (Use 0 for all, false for none) before the plugin is initialized. Note that the image must not have the src attribute set, use data-src instead
      dataAttribute : "src",               // In order to get deferred image loading set the dataAttribute attribute rather than src attribute.
      loadOnShow    : false,               // If true, successive images will not be loaded until they become active
      autoplay      : false,               // Whether to start playing immediately. Provide a number (in seconds) to delay the inital start to the slideshow
      hoverBehavior : function(slideshow){ // During autoplay, we'll generally want to pause the slideshow at some point. The default behavior is to pause when hovering the UI
        var api = $(slideshow).okCycle();
        (slideshow.data('ui') || slideshow).hover(api.pause, api.play);
      },
      // Events
      afterSetup    : function(slideshow){},        // Called immediately after setup is performed
      beforeMove    : function(slideshow, trans){}, // Called before we move to another slide
      afterMove     : function(slideshow, trans){}, // Called after we move to another slide
      onPreload     : function(slideshow, img){ $(img).hide(); }, // Called when an loadOnShow is enabled and preload < the total number of images
      onProgress    : function(slideshow, data, img){ $(img).fadeIn(); }, // Called when an item is loaded
      onDone        : function(slideshow, data){}   // Called when all items are loaded
    }, opts);

    if (!$.okCycle[opts.transition]) throw("No such transition '"+opts.transition+"'"); // Fail early since we don't know what to do

    set.each(function(){
      var self = $(this);

      if (!self.data(cycle)) initialize(self.data(cycle, opts), opts);
    });

    function e(fn){
      set.each(function(){ 
        var s = $(this);

        if (s.data(cycle)) fn(s); 
      }); 

      return api;
    }

    // Control slideshow manually
    // $(element).okCycle().play()
    api = {
      pause  : function(){ return e(pause);}, 
      play   : function(){ return e(play); }, 
      next   : function(){ return e(next); }, 
      prev   : function(){ return e(prev); }, 
      moveTo : function(i){ return e(function(s){ moveTo(s, i); });} 
    };

    return api;
  };

  // Store keys as variables to improve minification, catch typos
  var cycle       = 'okcycle',
      animating   = 'animating',
      autoplaying = 'autoplaying',
      active      = 'active',
      interval    = 'interval',
      images      = 'images';

  // Load previously deferred images
  function load(self, imgs){ 
    var opts = self.data(cycle),
        data = self.data(images);

    return imgs
      .each(function(){
        var self = $(this), 
            src  = self.data(opts.dataAttribute);

        if (src) {
          this.src = src; 
          self.removeAttr('data-'+opts.dataAttribute);
        }
      })
      .imagesLoaded()
        .progress(function(instance, image) { 
          data.loaded++;

          if (!image.isLoaded) data.broken++;

          opts.onProgress(self, data, image.img); 

          if (data.loaded >= data.total) opts.onDone(self, data);
        });
  }

  // Disable autoplay
  function pause(self){
    if (self.data(interval)) {
      // Store it so we can cancel it
      self.data(interval, clearTimeout(self.data(interval)));
    }

    return self.data(autoplaying, false);
  }

  // Autoplay
  function play(self){
    self.data(autoplaying, true);

    return self.data(interval, setTimeout(function(){ next(self); }, self.data(cycle).duration));
  }

  // Move forwards
  function next(self){
    var old = self.data(active), 
        cur = old+1;

    return transitionTo(self, old, cur == self.children().length ? 0 : cur, true);
  }

  // Move backwards
  function prev(self){
    var old = self.data(active), 
        cur = old-1;

    return transitionTo(self, old,  cur < 0 ? self.children().length-1 : cur, false);
  }

  // Move to a specific slide
  function moveTo(self,idx){
    var activeIdx = self.data(active); 

    return transitionTo(self, activeIdx , idx, idx > activeIdx); 
  }

  // Transition to another slide using the chosen transition
  function transitionTo(self, prev, cur, forward){
    var data, activeItems, fn, opts = self.data(cycle);

    if (!self.data(animating) && prev != cur) {
    
      self.data(animating, true);

      data = $.extend($.Deferred(),{ 
        from      : self.children().eq(prev),
        to        : self.children().eq(cur),
        fromIndex : prev,
        toIndex   : cur,
        forward   : forward,
        easing    : opts.easing,
        speed     : opts.speed
      });

      opts.beforeMove(self, data);

      // After the transition resolves the deferred, setup to transition to
      // the next slide (autoplay)
      data.done(function(){
        self.data(animating, false);

        opts.afterMove(self, data);

        if (self.data(autoplaying)) play(self); 
      });

      // Transition to the next slide
      activeItems = $.okCycle[opts.transition].move(self.data(active, cur), data);

      // We can't depend on the transition returning items in same same
      // order, so load whatever the transition returns as the active items
      if (opts.preload > 0 && opts.loadOnShow) {
        (activeItems || transition.to)
          .find("img")
          .each(function(){ 
            if ($(this).attr('data-'+opts.dataAttribute)) load(self, $(this)); // Load the next image if it hasn't already been loaded
          }); 
      }

      // Tell the UI we've moved
      $.each(opts.ui, function(){
        fn = $.okCycle.ui[this];
        if (fn && fn.move) { 
          fn.move(self, self.data('ui'), data); 
        }
      });
    }

    return self;
  }

  // Setup our instance
  function initialize(self, opts){
    var imgs = opts.preload === false ? $('') : $('img', self),
        data,  
        initFn;

    self.data(images, { loaded: 0, broken: 0, total : imgs.length });

    data = self.data(images);

    // If you've elected to load on show you need to omit the src attribute
    // to prevent the browser from loading the image and set the data-src
    // attribute instead - otherwise this basically does nothing
    if (opts.preload && opts.preload > 0) {
      if (opts.loadOnShow) {
        imgs.slice(opts.preload).each(function(){ opts.onPreload(self, this); });
      }

      // Store the images we need to preload
      imgs = imgs.slice(0, opts.preload);
    }

    // Store the index of current slide rather than the element as the UI can
    // shuffle the content around
    self.data(active, 0);

    // Initialize UI
    if (opts.ui.length){
      // Ensure that the UI is contained in a parent element
      self.data('ui', self.addClass('okCycle').wrap("<div class='okCycle-ui'/>").parent());

      $.each(opts.ui, function(i, v){ 
        if ((initFn = $.okCycle.ui[v].init)) 
          initFn(self, self.data('ui'), opts); 
      });
    }

    // Initialize transition after all images have loaded
    load(self,imgs).done(function(instance) { 
      $.okCycle[opts.transition].init(self, opts); 
    });

    // Start autoplaying if enabled
    if ( opts.autoplay === true || typeof(opts.autoplay) == 'number' ){ 
      setTimeout(function(){ 
        play(self); 
      }, isNaN(opts.autoplay) ? 0 : opts.autoplay);

      // Setup hover behavior
      if ($.isFunction(opts.hoverBehavior)) opts.hoverBehavior(self);
    }

    // Call after setup hook
    opts.afterSetup(self);
  }

})(jQuery);
