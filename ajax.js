/**
 * @fileOverview Ajax class / require js amd module.
 * @author <a href="http://nathansplace.co.uk">NathanG</a>
 * @version 0.0.1
 */

(function(root){
  /**
   * Ajax.js. This is an atempt at a nice clean light weight, speedy easy to use
   * interface ontop of the javascript XMLHttpRequest object. It is compatible
   * with require.js, and works as a stand alone vanilla javascript class.
   *
   * @class Ajax
   * @constructor Ajax
   * @param {string} args.url - request url
   * @param {string} [args.method] - HTTP request method. Defaults to GET. Must be
   * valid UPPERCASE http method.
   * @param {object} [args.data] - json request data
   * @param {string} [args.type] - request data content type. default is URLENCODED.
   * available types: JSON (application/json), or URLENCODED(application/x-www-formurlencoded).
   * @param {string} [args.token] - CSRF token. If not provided Ajax will look
   * for a Rails style CSRF token meta tag.
   * @param {onSuccess} [args.onSuccess] - Called after making a successful request.
   * @param {onError} [args.onError] - Called if request throws an error.
   * @param {onStart} [args.onStart] - Always called before other callbacks, at
   * start of request.
   * @param {onFinish} [args.onFinish] - Always called after other callbacks at
   * the end of the request.
   * @param {onTimeout} [args.onTimeout] - Called if request times out.
   * @param {float} [args.timeout] - Set timeout for request in miliseconds.
   * Defaults to no timeout.
   */

  /**
   * @callback onSuccess
   * @param {object} xhr - Called on successful xhr object.
   */

  /**
   * @callback onError
   * @param {object} xhr - Called on unuccessful xhr object.
   */

  /**
   * @callback onStart
   * @param {object} xhr - Called on start of xhr request.
   */

  /**
   * @callback onFinish
   * @param {object} xhr - Called on finish of xhr request.
   */

  /**
   * @callback onTimeout
   * @param {object} xhr - Called on timeout of xhr request.
   */

  //TODO: Add other common types.
  var CONTENT_TYPES = {
    'JSON': 'application/json',
    'URLENCODED': 'application/x-www-form-urlencoded'
  },

  TYPES = (function(){
    out = [];
    for(var key in CONTENT_TYPES){
      out.push(key);
    }

    return out;
  })(),

  METHODS = ['GET', 'POST', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE', 'CONNECT'],

  token = function(){
    var el = document.getElementsByName('csrf-token')[0];
    if(el !== 'undefined' && el != null){return el.content;}
    return null;
  },

  noop = function(){},

  contentType = function(ajax){
    return CONTENT_TYPES[ajax.type];
  },

  createRequest = function(ajax){
    var xhr = new XMLHttpRequest();

    if('withCredentials' in xhr){
      xhr.open(ajax.method, ajax.url, true);
    }else if(typeof XDomainRequest !== 'undefined'){
      // Cater for old ie.
      xhr = new XDomainRequest();
      xhr.open(ajax.method, ajax.url);
    }

    xhr.timeout = ajax.timeout;
    xhr.setRequestHeader('Content-type', contentType(ajax));

    if(ajax.token){xhr.setRequestHeader('X-CSRF-Token', ajax.token);}

    return xhr;
  },

  bindEvents = function(ajax, xhr){
    xhr.addEventListener('timeout', ajax.onTimeout(xhr), false);

    ajax.onStart(xhr);

    xhr.addEventListener('readystatechange', function(){
      if(this.readyState === 4){
        if(this.status === 200){
          ajax.onSuccess(this);
        }else{
          ajax.onError(this);
        }
        ajax.onFinish(this);
      }
    }, false);
  },

  parseData = function(ajax){
    if(ajax.type === 'JSON'){
      return JSON.stringify(ajax.data);
    }else{
      // x-www-form-urlencoded
      var out = [];

      for(var key in ajax.data){
        var value = ajax.data[key];
        out.push(key + '=' + encodeURIComponent(value));
      }

      return out.join('&');
    }
  };

  function Ajax(args){
    this.method = args.method || 'GET';
    this.url = args.url;
    this.data = args.data || {};
    this.token = args.token || token();
    this.onSuccess = args.onSuccess || noop;
    this.onError = args.onError || noop;
    this.onStart = args.onStart || noop;
    this.onFinish = args.onFinish || noop;
    this.onTimeout = args.onTimeout || noop;
    this.timeout = args.timeout || 0;
    this.type = args.type || 'URLENCODED';

    if(typeof args.url === 'undefined'){throw new Error('Ajax requires a url.');}
    if(METHODS.indexOf(this.method) === -1){throw new Error('Ajax method must be valid.');}
    if(TYPES.indexOf(this.type) === -1){throw new Error('Ajax content type must be valid.');}

    return this;
  }

  /**
   * Constructs, and sends ajax request.
   *
   * @memberOf Ajax
   * @param {object} args - see Ajax constructor.
   */
  Ajax.request = function(args){
    return new this(args).send();
  };

  /**
   * Sends ajax request.
   *
   * @memberOf Ajax
   */
  Ajax.prototype.send = function(){
    xhr = createRequest(this);

    bindEvents(this, xhr);
    xhr.send(parseData(this));

    return this;
  };

  if(typeof define === 'function' && define.amd){
    define('ajax', [], function(){return Ajax;}); // amd
  }else{
    root.Ajax = Ajax;
  }
}(this));

