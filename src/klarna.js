// Generated by CoffeeScript 1.10.0
(function() {
  var Promise, config, credentials, crypto, flags, fs, httpRequest, klarna, parseError, request, wrapper;

  crypto = require('crypto');

  request = require('request');

  Promise = require('promise');

  fs = require('fs');

  flags = {
    test: true,
    initalized: false
  };

  credentials = {
    eid: null,
    secret: null
  };

  config = {
    purchase_country: 'SE',
    purchase_currency: 'SEK',
    locale: 'sv-se',
    merchant: {
      id: null,
      terms_uri: null,
      cancellation_terms_uri: null,
      checkout_uri: null,
      confirmation_uri: null,
      push_uri: null
    },
    gui: {
      layout: 'desktop'
    }
  };

  klarna = {
    url: {
      test: 'https://checkout.testdrive.klarna.com/checkout/orders',
      live: 'https://checkout.klarna.com/checkout/orders'
    }
  };

  httpRequest = {
    headers: function(payload) {
      var biscuit, hash;
      biscuit = payload != null ? JSON.stringify(payload) + credentials.secret : credentials.secret;
      hash = crypto.createHash('sha256').update(biscuit).digest('base64');
      return {
        'Authorization': 'Klarna ' + hash,
        'Content-Type': 'application/vnd.klarna.checkout.aggregated-order-v2+json',
        'Accept': 'application/vnd.klarna.checkout.aggregated-order-v2+json'
      };
    },
    options: function(data, id) {
      var url;
      url = flags.test ? klarna.url.test : klarna.url.live;
      return {
        url: id != null ? url + '/' + id : url,
        headers: this.headers(data),
        body: data,
        json: data != null ? true : false
      };
    }
  };

  exports.init = function(input) {
    if (input.eid != null) {
      credentials.eid = input.eid;
      config.merchant.id = input.eid;
    }
    if (input.secret != null) {
      credentials.secret = input.secret;
    }
    if ((input.test != null) && typeof input.test === 'boolean') {
      flags.test = input.test;
    }
    if ((input.eid != null) && (input.secret != null)) {
      return flags.initalized = true;
    }
  };

  exports.config = function(input) {
    if (input.purchase_country != null) {
      config.purchase_country = input.purchase_country;
    }
    if (input.purchase_currency != null) {
      config.purchase_currency = input.purchase_currency;
    }
    if (input.locale != null) {
      config.locale = input.locale;
    }
    if (input.layout != null) {
      if (input.layout === 'desktop' || input.layout === 'mobile') {
        config.gui.layout = input.layout;
      }
    }
    if (input.terms_uri != null) {
      config.merchant.terms_uri = input.terms_uri;
    }
    if (input.cancellation_terms_uri != null) {
      config.merchant.cancellation_terms_uri = input.cancellation_terms_uri;
    }
    if (input.checkout_uri != null) {
      config.merchant.checkout_uri = input.checkout_uri;
    }
    if (input.confirmation_uri != null) {
      config.merchant.confirmation_uri = input.confirmation_uri;
    }
    if (input.push_uri != null) {
      return config.merchant.push_uri = input.push_uri;
    }
  };

  wrapper = function(f) {
    var key, ref, value;
    if (!flags.initalized) {
      return function() {
        return new Promise(function(resolve, reject) {
          return reject('Klarna module not initialized. Please use init() method.');
        });
      };
    }
    ref = config.uris;
    for (key in ref) {
      value = ref[key];
      if (value == null) {
        return function() {
          return new Promise(function(resolve, reject) {
            return reject("'%s' not set", key);
          });
        };
        break;
      }
    }
    return f;
  };

  parseError = function(error, response, body) {
    if (error) {
      return {
        type: 'HTTP Request',
        code: error.code,
        message: error.message
      };
    } else if (body) {
      console.log("Klarna error");
      return {
        type: 'Klarna',
        code: body.http_status_code + " - " + body.http_status_message,
        message: body.internal_message
      };
    }
  };

  exports.place = function(cart) {
    var place;
    place = function() {
      return new Promise(function(resolve, reject) {
        var resource;
        resource = config;
        resource.cart = cart;
        return request.post(httpRequest.options(resource), function(error, response, body) {
          var err, location;
          err = parseError(error, response, body);
          if (err != null) {
            return reject(err);
          } else if ((response.statusCode != null) && response.statusCode === 201) {
            location = response.headers.location;
            return resolve(location.slice(location.lastIndexOf('/') + 1));
          }
        });
      });
    };
    return wrapper(place)();
  };

  exports.fetch = function(id) {
    var fetch;
    fetch = function() {
      return new Promise(function(resolve, reject) {
        return request.get(httpRequest.options(null, id), function(error, response, body) {
          if ((response.statusCode != null) && response.statusCode === 200) {
            return resolve(JSON.parse(body));
          } else {
            return reject(parseError(error, response, JSON.parse(body)));
          }
        });
      });
    };
    return wrapper(fetch)();
  };

  exports.update = function(id, data) {
    var update;
    update = function() {
      return new Promise(function(resolve, reject) {
        return request.post(httpRequest.options(data, id), function(error, response, body) {
          if ((response.statusCode != null) && response.statusCode === 200) {
            return resolve(body);
          } else {
            return reject(parseError(error, response, body));
          }
        });
      });
    };
    return wrapper(update)();
  };

  exports.confirm = function(id, orderid1, orderid2) {
    var confirm;
    confirm = function() {
      return new Promise(function(resolve, reject) {
        var data;
        data = {
          status: 'created'
        };
        if (orderid1 != null) {
          data.merchant_reference = {
            orderid1: orderid1
          };
        }
        if (orderid2 != null) {
          data.merchant_reference.orderid2 = orderid2;
        }
        return exports.update(id, data).then(function(order) {
          return resolve(order);
        }, function(error) {
          return reject(error);
        });
      });
    };
    return wrapper(confirm)();
  };

}).call(this);
