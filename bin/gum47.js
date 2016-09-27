#!/usr/local/bin/node
'use strict';

//////////////////////////////////////////////////////////////////////
// Modules
var _ = require('underscore');
var restify = require('restify');
var MongoClient = require('mongodb').MongoClient;

//////////////////////////////////////////////////////////////////////
// Gum47 Server
var Gum47 = function() {

  var self = this;
  self.version = "0.0.1";

  // Base URL
  self.baseURL = 'http://gum47.com/api';

  // DBs
  self.db = { };

  // Create the restify instance and set plugins
  var server = restify.createServer({name: 'Gum47'});
  server.pre(restify.pre.sanitizePath());
  server.use(restify.bodyParser({ mapParams: false }));
  server.use(restify.queryParser());
  server.use(restify.dateParser(5));

  ////////////////////
  // CORS Support
  restify.CORS.ALLOW_HEADERS.push('x-json');
  restify.CORS.EXPOSE_HEADERS.push('x-json');
  server.use(restify.CORS());

  server.on('uncaughtException', function (request, response, route, error) {
    console.log('GUM47 API ERROR: ' + request.method + ' ' + route.spec.path);
    console.log(error.stack);
  });

  server.opts(/.*/, function (req,res,next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', req.header('Access-Control-Request-Method'));
    res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
    res.send(200);
    return next();
  });

  server.use(function (req,res,next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });

  function placeHolder(req, res, next) {
    console.log(req);
    res.send(200, { status: 'awesome' });
    next();
  }

  ////////////////////

  //////////////////////////////////////////////////////////////////
  // Endpoints

  server.get('/systems/count', function(req, res, next) {
    self.db.systems.find().count(function(err, systemCount) {
      res.send(200, { systems: systemCount });
      next();
    });
  });

  server.get('/system/:id', function(req, res, next) {
    self.db.systems.findOne({ id: req.params.id }, function(err, result) {
      if (err) {
        res.send(404, { message: 'no system found' });
      } else {
        console.log(result);
        res.send(200, result);
      }
      next();
    });
  });

  server.get('/system/:x/:y', function(req, res, next) {
    var x = parseInt(req.params.x);
    var y = parseInt(req.params.y);

    self.db.systems.findOne({ x: x, y: y }, function(err, result) {
      if (err) {
        res.send(404, { message: 'no system found at coordinates' });
      } else {
        console.log(result);
        result.href = self.baseURL + '/system/' + result.id;
        res.send(200, result);
      }
      next();
    });
  });

  server.get('/system/neighbors/:x/:y', function(req, res, next) {
    var x = parseInt(req.params.x);
    var y = parseInt(req.params.y);

    var distance = 5;

    self.db.systems.find({ x: { $gte: (x - distance), $lte: (x + distance) },
                           y: { $gte: (y - distance), $lte: (y + distance) } }).
      toArray(function(err, results) {
        if (err) {
          res.send(404, { message: 'no systems found near coordinates' });
        } else {
          console.log(results);
          _.each(results, function(item) {
            item.href = self.baseURL + '/system/' + item.id;
          });
          res.send(200, { items: results, count: results.length });
        }
        next();
      });
  });

  ////////////////////
  // Root
  server.get('/', placeHolder);

  self.boot = function() {
    MongoClient.connect('mongodb://localhost:27017/gum47', { wtimeout: 60000 }, function(err, db) {
      self.db.systems = db.collection('systems');

      server.listen(4215, '127.0.0.1', function() {
        console.info('Gum47 API Server v%s listening at %s', self.version, server.url);
      });
    });
  };

  return self;
};

//////////////////////////////////////////////////////////////////////

var gum47 = new Gum47();
gum47.boot();
