/**
 * jquery.okCycle.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 08/27/13
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
      eagerLoad     : 1,                   // During setup, force okCycle to N images before the slideshow is initialized. Set to 0 to load all images
      autoplay      : false,               // Whether to start playing immediately. Provide a number (in milliseconds) to delay the inital start to the slideshow
      hoverBehavior : function(slideshow){ // During autoplay, we'll generally want to pause the slideshow at some point. The default behavior is to pause when hovering the UI
        var api = $(slideshow).okCycle();
        (slideshow.data('ui') || slideshow).hover(api.pause, api.play);
      },
      // Callbacks
      afterSetup  : function(slideshow){},            // Called immediately after setup is performed
      beforeMove  : function(slideshow, transition){},// Called before moving to another slide
      afterMove   : function(slideshow, transition){},// Called after moving to another slide
      onLoad      : function(slideshow, imageData){   // Control how images are shown when loaded. Default is to hide the image until it is loaded and then fade in
        imageData.img.fadeTo.apply(imageData.img, imageData.isLoaded ? ['fast',1] : [0,0]);
      }
    }, opts);

    if (!$.okCycle[opts.transition]) throw("No such transition '"+opts.transition+"'"); // Fail early since we don't know what to do

    function e(fn){
      set.each(function(){ fn($(this)); }); return api;
    }

    // Control slideshow manually - note that this will operate on every
    // element in the set, so only select the slideshow you want to operate on
    //
    // e.g. $(element).okCycle().play()
    api = {
      element  : set,
      pause    : function(){ return e(pause); },
      play     : function(){ return e(play);  },
      next     : function(){ return e(next);  },
      prev     : function(){ return e(prev);  },
      moveTo   : function(i){ return e(function(s){ moveTo(s, i); });},
      // Hook into the image loading process
      progress : function(f){ return e(function(s) { s.data(imageData).progress(f); }); },
      done     : function(f){ return e(function(s) { s.data(imageData).done(f); }); }
    };

    return e(function(s){ if (!s.data(cycle)) initialize(s.data(cycle, opts), opts); });
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
        fn   = opts.onLoad;

    return imgs.each(function(i){
      var img = $(this).addClass('loading'),
          src = img.data(opts.dataAttribute) || this.src;

      img.removeAttr('data-'+opts.dataAttribute);

      fn(self, { img: img });

      $("<img />")
        .attr("src", src)
        .imagesLoaded()
        .progress(function(inst, imageData){
          img.attr("src", src)[0].loaded = true;
          notify(self, data, imageData);
          fn(self, { isLoaded: imageData.isLoaded, img: img });
        });
    });
  }

  function notify(self, data, image){
    if (!image.isLoaded) data.broken++;
    data.loaded++;
    data.notifyWith(self, [data, image]);
    if (data.loaded >= data.total) data.resolveWith(self, [data, image]);
  }

  // Disable autoplay
  function pause(self){
    if (self.data(interval))
      self.data(interval, clearTimeout(self.data(interval)));

    return self.data(autoplaying, false);
  }

  // Enable Autoplay
  function play(self){
    self.data(autoplaying, true);

    // Ensure interval is destroyed before creating a new one
    clearTimeout(self.data(interval));

    // Store it so we can cancel it
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
    var imgs    = $('img', self),
        normal  = imgs.filter(":not([data-"+opts.dataAttribute+"])"),     // Non lazy images
        eager   = opts.eagerLoad ? imgs.slice(0, opts.eagerLoad) : $(''), // Store the images we're going to eagerLoad
        data    = $.extend($.Deferred(),{ loaded: 0, broken: 0, total : imgs.length }),
        dfd     = $.Deferred(),
        initFn;

    dfd.resolve();

    // Store image data
    self.data(imageData, data);

    // Store the index of current slide 
    self.data(active, 0);

    // Ensure that the UI is contained in a parent element
    if (opts.ui.length) self.data('ui', self.addClass('okCycle').wrap("<div class='okCycle-ui'/>").parent());

    // Chain the loading of the UI. UI elements can block loading of subsequent elements until they
    // are finished by returning a deferred for their init function
    $.map(opts.ui, function(v,i) {
      dfd = dfd.pipe(function(data) {
         if ((initFn = $.okCycle.ui[v].init))
           return initFn(self, self.data('ui'), opts);
      });
    });

    // Don't initialize until the UI is fully ready
    dfd.always(function(){
      // Initialize transition after all eager loaded images have loaded
      eager.imagesLoaded().always(function(){
        $.okCycle[opts.transition].init(self, opts);

        // Start autoplaying after a delay of opts.autoplays milliseconds if enabled
        if (opts.autoplay === true || typeof(opts.autoplay) == 'number'){
          setTimeout(function(){
            play(self);
          }, isNaN(opts.autoplay) ? 0 : opts.autoplay);

          // Setup hover behavior
          if ($.isFunction(opts.hoverBehavior)) opts.hoverBehavior(self);
        }
      });

      // Call after setup hook
      opts.afterSetup(self);
    });

    // Load all eager and normal images
    load(self, eager.add(normal));
  }

})(jQuery);
