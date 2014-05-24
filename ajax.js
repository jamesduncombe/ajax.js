/*global XDomainRequest*/

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
   * @param {string} [args.method] - HTTP request method. Defaults to GET.
   * Must be valid UPPERCASE http method.
   * @param {object} [args.data] - json request data
   * @param {string} [args.type] - request data content type. default is
   * URLENCODED. available types: JSON (application/json),
   * or URLENCODED(application/x-www-formurlencoded).
   * @param {string} [args.token] - CSRF token. If not provided Ajax will look
   * for a Rails style CSRF token meta tag.
   * @param {onSuccess} [args.onSuccess] - Called after making a successful
   * request.
   * @param {onError} [args.onError] - Called if request throws an error.
   * @param {onStart} [args.onStart] - Always called before other callbacks, at
   * start of request.
   * @param {onFinish} [args.onFinish] - Always called after other callbacks at
   * the end of the request.
   * @param {onTimeout} [args.onTimeout] - Called if request times out.
   * @param {float} [args.timeout] - Set timeout for request in miliseconds.
   * Defaults to no timeout.
   * @param {array} args.headers - Request headers to be set.
   * [{key: 'Key', value: 'Value'}]
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

  'use strict';

  //TODO: Add other common types.
  var CONTENT_TYPES = {
    'URLENCODED': 'application/x-www-form-urlencoded',
    'JSON': 'application/json'
  },

  TYPES = (function(){
    var out = [];
    for(var key in CONTENT_TYPES){
      if(CONTENT_TYPES.hasOwnProperty(key)){
        out.push(key);
      }
    }

    return out;
  })(),

  METHODS = [
    'GET',
    'POST',
    'PUT',
    'HEAD',
    'DELETE',
    'OPTIONS',
    'TRACE',
    'CONNECT'
  ],

  token = function(){
    var el = document.getElementsByName('csrf-token')[0];
    if(typeof el !== 'undefined' && el !== null){return el.content;}
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

  dataToUrlEncoded = function(data){
    var out = [];

    for(var key in data){
      if(data.hasOwnProperty(key)){
        out.push(key + '=' + encodeURIComponent(data[key]));
      }
    }

    return out.join('&');
  },

  parseData = function(ajax){
    if(ajax.type === 'JSON'){
      return JSON.stringify(ajax.data);
    }else{
      // x-www-form-urlencoded
      return dataToUrlEncoded(ajax.data);
    }
  },

  setHeaders = function(ajax, xhr){
    var headers = ajax.headers;
    for(var i=0; i<headers.length; i++){
      var header = headers[i];
      xhr.setRequestHeader(header.key, header.value);
    }
  },

  mergeArgs = function(ajax, args){
    ajax.method = args.method || METHODS[0];
    ajax.url = args.url;
    ajax.data = args.data || {};
    ajax.token = args.token || token();
    ajax.timeout = args.timeout || 0;
    ajax.type = args.type || TYPES[0];
    ajax.headers = args.headers || [];
  },

  mergeCallbacks = function(ajax, args){
    var callbacks = [
      'onSuccess',
      'onError',
      'onStart',
      'onFinish',
      'onTimeout'
    ];

    for(var i=0; i < callbacks.length; i++){
      var callback = callbacks[i];
      ajax[callback] = args[callback] || noop;
    }
  },

  validateUrl = function(url){
    if(typeof url === 'undefined'){
      throw new Error('Ajax requires a url.');
    }
  },

  validateMethod = function(method){
    if(METHODS.indexOf(method) === -1){
      throw new Error('Ajax method must be valid.');
    }
  },

  validateType = function(type){
    if(TYPES.indexOf(type) === -1){
      throw new Error('Ajax content type must be valid.');
    }
  },

  validateAjax = function(ajax){
    validateUrl(ajax.url);
    validateMethod(ajax.method);
    validateType(ajax.type);
  },

  defaultHeaders = function(ajax){
    ajax.headers.push({key: 'Content-Type', value: contentType(ajax)});

    if(ajax.token){
      ajax.headers.push({key:'X-CSRF-Token', value: ajax.token});
    }
  };

  function Ajax(args){
    mergeArgs(this, args);
    mergeCallbacks(this, args);
    validateAjax(this);
    defaultHeaders(this);

    return this;
  }

  /**
   * Constructs, and sends ajax request.
   *
   * @memberOf Ajax
   * @param {object} args - see Ajax constructor.
   */
  Ajax.request = function(args){
    return new Ajax(args).send();
  };

  /**
   * Sends ajax request.
   *
   * @memberOf Ajax
   */
  Ajax.prototype.send = function(){
    var xhr = createRequest(this);

    setHeaders(this, xhr);

    bindEvents(this, xhr);
    xhr.send(parseData(this));

    return this;
  };

  var define = window.define || null;

  if(typeof define === 'function' && define.amd){
    define('ajax', [], function(){return Ajax;}); // amd
  }else{
    root.Ajax = Ajax;
  }
}(this));

