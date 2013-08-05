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

  // Default options
  $.fn.okCycle = function(opts){
    opts = $.extend({
      transition    : 'scroll',            // Transition used to cycle elements
      easing        : 'swing',             // Easing used by the transition
      ui            : [],                  // Any UI elements that we should build. Appended in source order
      duration      : 2000,                // Time between animations
      speed         : 300,                 // Speed the slides are transitioned between
      preload       : 1,                   // Number of images to load (Use 0 for all, false for none) before the plugin is initialized. Note that the image must not have the src attribute set, use data-src instead
      dataAttribute : "src",               // In order to get deferred image loading to work you can't set the src attribute (compatible with http://www.appelsiini.net/projects/lazyload)
      loadOnShow    : false,               // If true, successive images will not be loaded until they become active
      autoplay      : false,               // Whether to start playing immediately. Provide a number (in seconds) to delay the inital start to the slideshow
      hoverBehavior : function(slideshow){ // During autoplay, we'll generally want to pause the slideshow at some point. The default behavior is to pause when hovering the UI
        (slideshow.data('ui') || slideshow).hover(
          function(){ slideshow.pause(); }, 
          function(){ slideshow.play();  }
        );
      },
      // Events
      afterSetup    : function(slideshow){},             // Called immediately after setup is performed
      beforeMove    : function(slideshow, transition){}, // Called before we move to another slide
      afterMove     : function(slideshow, transition){}, // Called after we move to another slide
      // Don't think this will even work with multiple slideshows - the callbacks, unlike the dfd allow you to pass in a specific instance to control it
      // I mean I guess it could be run for every instance, - it does't need to be run in order
      // Except once DONE is called the deferred is dead
      onDone        : function(slideshow, data){},       // Called when all items are loaded
      // The issue here is we CAN'T attach multiple callbacks without doing the orig = opts.onProgress
      // but we also can't prevent the default onProgress behavior
      onProgress    : function(slideshow, data, image){  // Called when an item is loaded
        $(image).fadeIn(); 
      }
    }, opts);

    // Store keys as variables to improve minification
    var transition  = $.okCycle[opts.transition],
        animating   = 'animating',
        autoplaying = 'autoplaying',
        active      = 'active',
        interval    = 'interval',
        images      = 'images',
        unloaded    = 'unloaded';

    if (!transition) throw("No such transition '"+opts.transition+"'"); // Fail early since we don't know what to do

    // Load image if it has been previously unloaded
    function loadItem(self, img){ 
      var idx  = $.inArray(img[0], self.data(unloaded)),
          data = self.data(images),
          src,
          image;

      if (idx > -1) {
        if ((src = img.data(opts.dataAttribute))) img[0].src = src; 

        // This will only ever load one image at a time
        img.imagesLoaded()
          .progress(function(instance, image) {
            self.data(unloaded).splice(idx, 1);

            data.loaded++;

            if (!image.isLoaded) data.broken++;

            opts.onProgress(self, data, image.img); 

            if (data.loaded === data.total) opts.onDone(self, data);
          });
      }
    }

    // Disable autoplay
    function pause(self){
      if (self.data(interval)) {
        self.data(interval, clearTimeout(self.data(interval)));
      }

      return self.data(autoplaying, false);
    }

    // Autoplay
    function play(self){
      self.data(autoplaying, true);

      return self.data(interval, setTimeout(function(){ next(self); }, opts.duration));
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
    function moveTo(self, idx){
      var activeIdx = self.data(active); 

      return transitionTo(self, activeIdx , idx, idx > activeIdx); 
    }

    // Transition to another slide using the chosen transition
    function transitionTo(self, prev, cur, forward){
      var data, activeItems, fn;

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
        activeItems = transition.move(self.data(active, cur), data);

        // We can't depend on the transition returning items in same same
        // order, so load whatever the transition returns as the active items
        if (opts.preload > 0 && opts.loadOnShow) {
          (activeItems || transition.to)
            .find("img")
            .each(function(){ loadItem(self, $(this)); }); // Load the next image 
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

    // We could have two deferreds, one for each slideshow
    function exposeAPI(self,dfd) {
      return $.extend(self,{
        pause    : function(el){ return pause(el || self); }, 
        play     : function(el){ return play(el || self);  }, 
        next     : function(el){ return next(el || self);  }, 
        prev     : function(el){ return prev(el || self);  }, 
        done     : function(f,el){ return dfd.done(f);     },
        progress : function(f,el){ return dfd.progress(f); },
        // move requires an index, so we need to determine 
        // whether we were passed an element to work with to 
        // determin argument order
        moveTo: function(){ 
          var el, idx = arguments[0];

          if (arguments.length == 2) {
            el  = arguments[0];
            idx = arguments[1];
          }

          return moveTo(el || self, idx); 
        } 
      });
    }

    return exposeAPI(this, $.Deferred()).each(function(){
      var self = $(this),
          imgs = opts.preload === false ? $('') : $('img', self),
          dfd  = $.Deferred(),
          data,  
          initFn;

      self.data(images, { loaded: 0, broken: 0, total : imgs.length });

      data = self.data(images);

      // If you've elected to load on show you need to omit the src attribute
      // to prevent the browser from loading the image and set the data-src
      // attribute instead - otherwise this basically does nothing
      if (opts.preload && opts.preload > 0) {
        if (opts.loadOnShow) {
          self.data(unloaded, []);

          imgs.slice(opts.preload).each(function(){
            self.data(unloaded).push($(this).hide()[0]);
          });
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
      imgs.imagesLoaded()
        .done(function(instance) { 
          // We may or may not have actually loaded all images here depending
          // on whether or not the user has elected to loadOnShow
          if (data.loaded == data.total) opts.onDone(self, data); 

          transition.init(self, opts); 
        })
        .progress(function(instance, image) { 
          data.loaded++;

          if (!image.isLoaded) data.broken++;

          opts.onProgress(self, data, image.img); 
        });

      // Expose API for each element in the set
      exposeAPI(self);

      // Start autoplaying if enabled
      if ( opts.autoplay === true || typeof(opts.autoplay) == 'number' ){ 
        setTimeout(function(){ 
          play(self); 
        }, isNaN(opts.autoplay) ? 0 : opts.autoplay);

        // Setup hover behavior
        if (typeof(opts.hoverBehavior) == 'function') opts.hoverBehavior(self);
      }

      // Call after setup hook
      opts.afterSetup(self);
    });
  };

})(jQuery);
