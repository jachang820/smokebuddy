const express = require('express');
const router = express.Router();

const labelsGet = require('./controllers/labelsGet');
const labelsPost = require('./controllers/labelsPost');

router.all('*', (req, res, next) => {
  res.locals.css = ['listAll.css'];
  res.locals.modelName = 'labels';
  res.locals.title = 'Labels';
  return next();
});

/* Show form for managing label URLs. */
router.get('/', labelsGet);

/* Add a new label URL. */
router.post('/', labelsPost);

module.exports = router;