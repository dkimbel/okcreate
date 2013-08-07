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
    var set = this, cs, api;

    opts = $.extend({
      transition    : 'scroll',            // Transition used to cycle between children
      easing        : 'swing',             // Easing used by the transition
      ui            : [],                  // Any UI elements that we should build. Appended to the UI container source order
      duration      : 2000,                // Time between animations
      speed         : 300,                 // Speed the children are transitioned between
      dataAttribute : "src",               // Lazy load images by setting the dataAttribute (e.g. data-src) attribute rather than src attribute
      eagerLoad     : 1,                   // During setup, force okCycle to N images when using the data-src attribute to lazy load. Set to 0 to load all images
      autoplay      : false,               // Whether to start playing immediately. Provide a number (in milliseconds) to delay the inital start to the slideshow
      hoverBehavior : function(slideshow){ // During autoplay, we'll generally want to pause the slideshow at some point. The default behavior is to pause when hovering the UI
        var api = $(slideshow).okCycle();
        (slideshow.data('ui') || slideshow).hover(api.pause, api.play);
      },
      // Callbacks
      afterSetup  : function(slideshow){},           // Called immediately after setup is performed
      beforeMove  : function(slideshow, trans){},    // Called before we move to another slide
      afterMove   : function(slideshow, trans){},    // Called after we move to another slide
      onLazyLoad  : function(slideshow, imageData){  // Control how lazy loaded images are shown
        $(imageData.img)[imageData.isLoaded ? 'fadeIn' : 'hide']();
      }

    }, opts);

    if (!$.okCycle[opts.transition]) throw("No such transition '"+opts.transition+"'"); // Fail early since we don't know what to do

    set.each(function(){
      var self = $(this);
      if (!self.data(cycle)) initialize(self.data(cycle, opts), opts);
    });

    function e(fn){
      set.each(function(){ if ((cs = $(this)) && cs.data(cycle)) fn(cs); }); 
      return api;
    }

    // Control slideshow manually - note that this will operate on every
    // element in the set, so only select the slideshow you want to operate on
    //
    // e.g. $(element).okCycle().play()
    api = {
      element : set,
      pause   : function(){ return e(pause); }, 
      play    : function(){ return e(play); }, 
      next    : function(){ return e(next); }, 
      prev    : function(){ return e(prev); }, 
      moveTo  : function(i){ return e(function(s){ moveTo(s, i); });} 
    };

    return api;
  };

  // Store keys as variables to improve minification, catch typos
  var cycle       = 'okcycle',
      animating   = 'animating',
      autoplaying = 'autoplaying',
      active      = 'active',
      interval    = 'interval',
      imageData   = 'imageData';

  // Lazy Load images
  function load(self, imgs){ 
    var opts = self.data(cycle),
        data = self.data(imageData),
        fn   = opts.onLazyLoad;

    return imgs.each(function(){
      var img = $(this), 
          src = img.data(opts.dataAttribute);

      fn(self, { img: img });

      img.imagesLoaded().progress(function(inst,img){ 
        notify(data,img); 
        fn(self, img); 
      });

      if (src) {
        this.src = src; 
        img.removeAttr('data-'+opts.dataAttribute);
      }
    });
  }

  function notify(data, image){
    if (!image.isLoaded) data.broken++;
    ++data.loaded;
  }

  // Disable autoplay
  function pause(self){
    if (self.data(interval)) 
      self.data(interval, clearTimeout(self.data(interval))); // Store it so we can cancel it

    return self.data(autoplaying, false);
  }

  // Enable Autoplay
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

  // Show another slide using the selected transition
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
      (activeItems || transition.to)
        .find("img")
        .each(function(){ 
          if ($(this).attr('data-'+opts.dataAttribute)) load(self, $(this)); // Load the next image if it hasn't already been loaded
        }); 

      // Update the UI
      $.each(opts.ui, function(){
        if ((fn = $.okCycle.ui[this]) && fn.move) 
          fn.move(self, self.data('ui'), data); 
      });
    }

    return self;
  }

  // Setup our instance
  function initialize(self, opts){
    var imgs      = $('img', self), 
        data      = $.extend($.Deferred(),{ loaded: 0, broken: 0, total : imgs.length }),
        eagerImgs = opts.eagerLoad ? imgs.slice(0, opts.eagerLoad) : $(''), // Store the images we're going to eagerLoad
        initFn;

    // Store image data
    self.data(imageData, data);

    // Store the index of current slide 
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

    // Initialize transition after all eager loaded images have loaded
    eagerImgs
    .imagesLoaded()
      .progress(function(inst,img){ notify(data,img); })
      .always(function(){ $.okCycle[opts.transition].init(self, opts); });

    load(self, eagerImgs);

    // Start autoplaying after a delay of opts.autoplays milliseconds if enabled
    if (opts.autoplay === true || typeof(opts.autoplay) == 'number'){ 
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
