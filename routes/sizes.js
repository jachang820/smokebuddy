const express = require('express');
const router = express.Router();

const stylesGet = require('../controllers/stylesGet');
const stylesPost = require('../controllers/stylesPost');
const stylesPut = require('../controllers/stylesPut');

/* Show form for managing sizes. */
router.get('/', stylesGet('size'));

/* Add a new size. */
router.post('/', stylesPost('size'));

/* Change active status of size. If size has no items,
   then delete size. */
router.put('/:id', stylesPut('size'));

module.exports = router;
