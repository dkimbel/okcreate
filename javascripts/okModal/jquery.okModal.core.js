/**
 * jquery.okModal.js
 *
 * Copyright (c) 2013 Asher Van Brunt | http://www.okbreathe.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * Date: 12/04/13
 *
 * @description For popups, modal windows, tooltips etc.
 * @author Asher Van Brunt
 * @mailto asher@okbreathe.com
 * @version 2.0 BETA
 *
 */

(function($) {
  "use strict";

  var id       = 0,
      W        = $(window),
      vminUnit = navigator.appVersion.indexOf("MSIE 9.")!=-1 ? 'vm' : 'vmin',
      vminSupport;

  // Determine whether we have vmin support and the type of unit
  $(function(){
    var elem      = $("<div/>",{id: 'supportsvmim_', style: 'width: 50' + vminUnit }).appendTo("body")[0],
        one_vw    = window.innerWidth/100,
        one_vh    = window.innerHeight/100,
        compWidth = parseInt((window.getComputedStyle ? getComputedStyle(elem, null) : elem.currentStyle).width,10);

    vminSupport = !!( parseInt(Math.min(one_vw, one_vh)*50,10) == compWidth );

    elem.remove();
  });

  window.OkModal = function(options, trigger){
    var defaultOptions = {
      template      : '<div data-ui-content />', // Modal template. The element that receives the content must be defined by a data-ui-content attribute
      transition    : 'fade',      // How the modal will be shown
      parent        : 'body',      // Where the modal is attached to
      events: {                    // Bind events for showing / hiding the modal
        'click element'         : 'open',
        'click modal .ui-close' : 'close',
        'click #ui-overlay'     : 'close'
      },
      overlay       : true,        // Whether or not the modal should show an overlay when it is displayed
      content       : null,        // What our modal contains. Determined by the plugin if omitted. Otherwise can be string or function
      // Modal dimensions. Can be a object or an function that returns a object. 
      // Valid keys: 'width', 'height' or 'scale'
      // Valid values: jQuery dimensions, or the special value 'natural'
      // NOTE scale excepts a value from 0 to 100 to use with the vmin unit in browsers that support it
      fullscreen    : false,       // Toggle html overflow:hidden/visible on show/hide
      dimensions    : { width: '50%', height: 'natural' },
      cssScaling    : true,        // More efficient than scaling in javascipt, but only takes browser width into consideration when resizing
      whiney        : true,        // Throws an error if okModal cannot determine the content type
      onCreate      : $.noop,      // Called when a modal is first created (arguments: modal, options)
      onOpen        : $.noop,      // Called when the modal is opened (arguments: modal, options)
      onDone        : $.noop,      // Called when the content is loaded (arguments: modal, options)
      onFail        : $.noop,      // Called when the content fails to load (arguments: modal, options)
      onClose       : $.noop,      // Called when a modal is closed (arguments: modal, options)
      onDestroy     : $.noop       // Called when a modal is destroyed (arguments: modal, options)
    },
    overlay = "#ui-overlay";

    this.trigger    = trigger;
    this.namespace  = '.modal-' + (++id);
    this.options    = $.extend({}, defaultOptions, options && options.ui && $.okModal.ui ? $.okModal.ui[options.ui].call(this, options) : null, options);
    this.modal      = $($.isFunction(this.options.template) ? this.options.template() : this.options.template);
    this.transition = $.okModal.transitions[this.options.transition];

    if (!this.transition) throw("No such transition `"+this.options.transition+"`");

    // Add our backdrop if we're using one
    if (this.options.overlay) {
      this.overlay = $(overlay).length ? $(overlay) : $("<div id='ui-overlay' />").appendTo("body").hide();
    }

    this.modal.appendTo(this.options.parent).addClass('ui-modal').hide();

    this.options.onCreate.call(this, this.modal, this.options);
  };

  $.extend(OkModal.prototype, {
    // Show the modal
    open: function(content, forceContentDetection){
      var self = this, dfd;

      this.options.onOpen.call(this, this.modal, this.options);

      // It's an event or we want to force detection, programmatically determine content
      if (content.currentTarget || forceContentDetection) {
        if (content.currentTarget) content = $(content.currentTarget);
        content = this.options.content ? this.options.content(content) : this.getContent(content);
      }

      // Wrap the content in a deferred if it isn't already
      if (content.promise && content.resolve) {
        dfd = content;
      } else {
        dfd = $.Deferred();
        dfd.resolve(content);
      }

      this.contentContainer().empty();

      dfd.then(function(html){ return self.append(html); }).done(function(){
        if (self.overlay) self.overlay.fadeIn();

        if (self.options.fullscreen) $("html").css({ overflow: 'hidden' });

        self.transition.onOpen.call(self, self.modal, self.options);
      });

      return this;
    },

    // Hide the modal
    close: function(){
      this.options.onClose.call(this, this.modal, this.options);
      this.transition.onClose.call(this, this.modal, this.options);

      if (this.options.fullscreen) $("html").css({ overflow: '' });

      W.off(this.namespace);

      if (this.overlay) this.overlay.fadeOut();

      return this;
    },

    // Remove the modal and unbind events
    destroy: function(){
      this.close();
      $(document, window).off(this.namespace);
      this.options.onDestroy.call(this, this.modal, this.options);
    },

    resize: function(){
      setDimensions(this, this.contentContainer().children());
      return this;
    },

    append: function(content){
      var self = this,
          dfd  = $.Deferred();

      // Ensure we're working with a jquery object
      if (!(content instanceof jQuery))
        content = content[0] == '<' ? $(content) : $("<div />").html(content);

      dfd
      .done(function(){
        content = content.appendTo(self.contentContainer());
        self.modal.show();
        setDimensions(self, content);
        self.modal.hide();
        self.options.onDone.call(self, self.modal, self.options);
      })
      .fail(function(){
        self.options.onFail.call(self, self.modal, self.options);
      });

      preloadContent(content, dfd);

      return dfd;
    },

    getContent: function(trigger) {
      var content, match, result, w, h;

      if (!trigger) return null;

      // We still have the same problem that we need to setup the content here
      $.each(this.contentTypes, function(key, fns){
        if ((match = fns.matcher.call(fns, trigger))) {
          w = trigger.data('width')  || (fns.dimensions || {}).width;
          h = trigger.data('height') || (fns.dimensions || {}).height;
          result = fns.content.call(fns, trigger, match);

          if (result.promise && result.done) {
            content = $.Deferred();

            result.done(function(html){
              content.resolve($(html).data({ width: w, height: h }));
            });
          } else {
            content = $(result).data({ width: w, height: h });
          }
          return false;
        }
      });

      if (this.options.whiney && !content) throw("Was unable to determine content");

      return content;
    },

    contentContainer: function() {
      return this.modal.find("[data-ui-content]").andSelf().filter("[data-ui-content]");
    },

    /*
     * Autodetect content type from a triggering element
     * Can be one of: image, video, map, inpage, or ajax
     *
     * You can add your own or extend exsiting. A contentType should have two functions:
     *
     * matcher - should return the source for the content
     * content - takes the source returned by the matcher and returns content to append to the modal
     *
     * There is one option property 'dimensions'
     *
     * Which will set the default dimensions for the content type if they have
     * not already been set in the plugin initialization options
     *
     * Both the 'video' and 'map' content type have an optional "sources"
     * object, which will be iterated over to retrieve the src. Extend these if
     * you want to support more video or map sources
     *
     */
    contentTypes: {
      video: {
        matcher: function(el){ return iterateSources(el, this.sources); },
        dimensions: { width : 940, height : 529 }, // 16:9
        content: function(el, url){ return iframe(url); },
        sources: {
          youtube: function(url){
            if (!url) return;
            var match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/);
            if (match && match[7].length == 11) return "//www.youtube.com/embed/" + match[7];
          },
          vimeo: function(url){
            if (!url) return;
            var match = url.match(/https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
            if (match && match[3].length) return "http://player.vimeo.com/video/" + match[3];
          }
        }
      },

      map: {
        matcher: function(el){ return iterateSources(el, this.sources); },
        dimensions: { width : 425, height : 350 },
        content: function(el, url){ return iframe(url); },
        sources: {
          // Note this doesn't support shortened google maps links e.g http://goo.gl/maps/abcd
          google: function(url){
            if (/^https?\:\/\/(www\.|maps\.)?google\.[a-z]+\/maps\/?\?([^&]+&)*/.test(url)) return url + '&output=embed';
          }
        }
      },

      image: {
        matcher: function(el){
          var href = el.attr('href'), match = href.match(/.*\.(jpe?g|gif|png|tiff|bmp)$/i);
          return match && href;
        },
        content: function(el, url){
          return "<img src='"+ url +"' alt='"+(el.data('caption') || el.attr('title') || '')+"' />";
        }
      },

      // Only fire if it's not one of the other content types
      ajax: {
        matcher: function(el){ if (!this.matchesOther(el)){ return el.attr('href'); } },
        content: function(el, url){ return $.get(url); },
        dimensions: { width : 425, height : 350 },
        matchesOther: function(el){
          var c     = OkModal.prototype.contentTypes,
              match = false;

          $.each(c, function(k,v){
            if (k != 'ajax' && c[k].matcher.call(c[k], el)) {
              match = true;
              return false;
            }
          });

          return match;
        }
      },

      inpage: {
        dimensions: { width : 425, height : 350 },
        matcher: function(el){ var href = el.attr('href'); return (/^#/).test(href) && href; },
        content: function(el, id){ return $(id).clone().show(); }
      }
    }
  });

  $.okModal = function(opts, trigger){
    var modal = new OkModal(opts, trigger);

    if (trigger) bindEvents(modal, trigger);

    return modal;
  };

  $.fn.okModal = function(opts){
    var modal = $.okModal(opts, this);
    return this.data('modal', modal);
  };

  //
  // Internal
  //

  function preloadContent(content,dfd) {
    var preload,
        done = function(){ dfd.resolve(); },
        fail = function(){ dfd.reject(); };

    // Preload images before the transition is called. Requires imagesloaded.js
    if ((preload = content.find('img').andSelf().filter('img')).length > 0) {
      if ($.fn.imagesLoaded) {
        preload.imagesLoaded().done(function(){
          preload.data({ width: preload[0].width, height: preload[0].height });
          done();
        }).fail(fail);
      } else { // image load event is unreliable, using the imagesloaded plugin is recommended
        (function(){
          var count  = preload.length,
              loaded = 0;

            preload.each(function(){
              var img  = $('<img />').hide().attr('src', $(this).attr('src')).appendTo('body');
              img.one('load', function(){
                loaded++;
                img.remove();
                if (loaded >= count) done();
              });
              if (preload[0].complete) preload.trigger('load');
            });
        })();
      }
    } else {
      done();
    }
  }

  function setDimensions(self, content) {
    var css = $.extend({}, self.options.dimensions) || {};

    if (typeof(css) == "function") css = css.call(self, self.modal, content);

    if (css.scale) {
      css = scale(self, css, content);
    } else {
      if (css.height == 'natural') css.height = natural(content,'clientHeight');
      if (css.width  == 'natural') css.width  = natural(content,'clientWidth');
    }

    self.modal.css(css);
  }

  // This needs to account for padding and the box-model
  function natural(content, property) {
    var size = 0;
    content.each(function(){ if (this.nodeType == 1) size += this[property]; });
    return size;
  }

  function scale(self, css, content) {
    // Attempt various ways to determine the dimensions of the content
    var width  = parseInt(content.attr('width')  || content.data('width')  || css.width  || content[0].width, 10),
        height = parseInt(content.attr('height') || content.data('height') || css.height || content[0].height, 10),
        max    = css.scale,
        wide   = width >= height,
        resizeFunction;

    if (!(width && height)) throw("Content does not have defined width and height");

    if (vminSupport && self.options.cssScaling) {
      return {
        maxWidth  : width,
        maxHeight : height,
        width     : (!wide ? (max * (width/height)) : max) + (width == height ? vminUnit : wide ? 'vw' : 'vh'),
        height    : (wide ? (max * (height/width)) : max) + (width == height ? vminUnit : wide ? 'vw' : 'vh')
      };
    } else {
      resizeFunction = function(){
        return aspectRatio(width, height, W.width() * (max/100), W.height() * (max/100));
      };

      W.on(("onorientationchange" in window ? "orientationchange" : "resize") + self.namespace, function(){
        self.modal.css(resizeFunction());
      });

      return resizeFunction();
    }
  }

  function aspectRatio(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = [maxWidth / srcWidth, maxHeight / srcHeight ];

    ratio = Math.min(ratio[0], ratio[1]);

    return { width: srcWidth*ratio, height: srcHeight*ratio };
  }

  /**
   * EventMaps are in the format:
   * event selector [, selector...]
   *
   * A special selector "element" is available which will target the selector of the object passed into
   * the create method (done automatically when using the $.fn.okOverlay form)
   */
  function bindEvents(self, trigger) {
    $.each(self.options.events, function(str, handler){
      var chunks   = str.split(" "),
          event    = chunks.shift(),
          selector = $.trim(chunks.join(" "));

      // Anywhere the special selector 'modal' has been used, replace it with modal selector
      selector = selector.replace(/(^|\s)modal(\s|$)/g, function($0,$1,$2){ return $1 + self.modal.selector + $2; });

      // Anywhere the special selector 'element' has been used, replace it with elements selector
      if (trigger) selector = selector.replace(/(^|\s)element(\s|$)/g, function($0,$1,$2){ return $1 + trigger.selector + $2; });

      $(document).on(event + self.namespace, $.trim(selector) === "" ? null : selector, function(e){
        e.preventDefault();

        // Internal method
        if (typeof(handler) == "string") {
          self[handler](e);
        } else { // External Function
          handler(e, self);
        }
      });
    });
  }

  function iframe(url, width, height) {
    return '<div class="iframe-scaler"><iframe src="'+url+'" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div>';
  }

  function iterateSources(el,sources) {
    var href = el.attr('href'),
        src = false;

    $.each(sources, function(k,fn){ if ((src = fn(href))) return false; });

    return src;
  }

})(jQuery);
