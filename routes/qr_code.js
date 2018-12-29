const express = require('express');
const router = express.Router();
const api = require('./api');
const qr = require('qr-image');
const jimp = require('jimp');
const secured = require('../middleware/secured');

/* GET random QR code generation for testing. */
router.get('/', function(req, res, next) {
  res.render('generate');
});

router.get('/generate', function(req, res, next) {
  // generate random UUID
  const arr = [8, 4, 4, 4, 12].map(function(term) {
    return Math.random().toString(16).substring(2, term + 2);
  }).join('-');
  const arr_string = `http://www.smokebuddy.com/?id=${arr}`;

  // generate QR
  const qrcode = qr.imageSync(arr_string, { margin: 1, size: 4 });

  // open Smoke Buddy logo in Jimp
  const logo_file = './public/images/smokebuddy.png';
  jimp.read(logo_file)
    .then(function(logo) {
      return logo.scale(0.25);
    }).then(function(logo) {
      jimp.read(qrcode).then(function(qr) {
        return logo.composite(qr, 305, 360, {
          mode: jimp.BLEND_SOURCE_OVER,
          opacitySource: 1.0,
          opacityDest: 1.0
        }); 
      }).then(function(image) {
        image.getBuffer(jimp.MIME_PNG, function(err, buffer) {
          res.set('Content-type', jimp.MIME_PNG);
          res.send(buffer);
        });
      }).catch(function(err) {
        throw err;
      });   
    }).catch(function(err) {
      throw err;
    });
});

router.get('/barcode', (req, res, next) => {
  const text = req.query.id;
  
  try {
    const qrcode = qr.imageSync(text, { margin: 1, size: 4 });
    res.writeHead(200, {'Content-Type': 'image/png'});
    qrcode.pipe(res);
  } catch(e) {
    res.status(500).redirect('/error');
  }
})


module.exports = router;
