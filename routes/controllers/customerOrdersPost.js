const uuid = require('uuid/v4');
const { body, validationResult } = require('express-validator/check');
const setupAxios = require('../../helpers/setupAxios');

module.exports = [
  body('count').isNumeric().withMessage('Count must be a number.'),

  // Consolidate colors in database
  async (req, res, next) => {
    const axios = setupAxios();
    const colorsRes = await axios.get('/colors');
    const colors = colorsRes.data;

    req.body.colors = colors.map(color => color.name);
    return next();
  },

  // Consolidate sizes in database
  async (req, res, next) => {
    const axios = setupAxios();
    const sizesRes = await axios.get('/sizes');
    const sizes = sizesRes.data;

    req.body.sizes = sizes.map(size => size.name);
    return next();
  },

  body('colors').custom((colors, { req }) => {
    let rowsWithErrors = [];
    let itemCount = req.body.count;

    for (let i = 1; i <= itemCount; i++) {
      if (!colors.includes(req.body[`color${i}`])) {
        rowsWithErrors.push(i);
      }
    }

    if (rowsWithErrors.length > 0) {
      throw new Error("Invalid color on rows: " + rowsWithErrors.join(', '));
    } else {
      return true;
    }
  }),

  body('sizes').custom((sizes, { req }) => {
    let rowsWithErrors = [];
    let itemCount = req.body.count;

    for (let i = 1; i <= itemCount; i++) {
      if (!sizes.includes(req.body[`size${i}`])) {
        rowsWithErrors.push(i);
      }
    }

    if (rowsWithErrors.length > 0) {
      throw new Error("Invalid size on rows: " + rowsWithErrors.join(', '));
    } else {
      return true;
    }
  }),

  body().custom(async (body, { req }) => {
    const axios = setupAxios();

    let rowsWithErrors = [];
    let itemCount = req.body.count;

    for (let i = 1; i <= itemCount; i++) {
      const url = req.body[`item${i}`];
      const regex = /http:\/\/holoshield.net\/a\/([a-zA-Z0-9]*)/;

      const match = url.match(regex);

      if (!match) {
        rowsWithErrors.push(i);
        continue;
      }

      const itemId = match[1];
      req.body[`item${i}`] = itemId;
      let itemsRes;

      try {
        itemsRes = await axios.get(`items/${itemId}`);
      }
      catch (err) {
        throw err;
      }

      if (itemsRes.data) {
        rowsWithErrors.push(i);
      }
    }

    if (rowsWithErrors.length > 0) {
      throw new Error("Invalid item on rows: " + rowsWithErrors.join(', '));
    } else {
      return true;
    }
  }),

  async (req, res, next) => {
    try {
      const axios = setupAxios();

      const data = req.body;
      const itemCount = data.count;
      const label = data.label;
      const notes = data.notes;

      // Handle errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const customerOrdersRes = await axios.get('/customer_orders');
        const colorsRes = await axios.get('/colors');
        const sizesRes = await axios.get('/sizes')

        const customerOrders = customerOrdersRes.data;
        const colors = colorsRes.data;
        const sizes = sizesRes.data;

        return res.render('customer_orders', { customerOrders, colors, sizes, errors: errors.array() });
      }

      // Handle request
      const customerOrdersRes = await axios.post('/customer_orders', {
        label,
        notes
      });
      const CustomerOrderId = customerOrdersRes.data.id;

      for (let i = 1; i <= itemCount; i++) {
        const itemId = data[`item${i}`];
        const color = data[`color${i}`];
        const size = data[`size${i}`];

        await axios.post(`/items/${itemId}`, {
          id: itemId,
          status: 'Shipped',
          ColorName: color,
          SizeName: size,
          CustomerOrderId
        });
      }
      res.redirect(`/customer_orders/${CustomerOrderId}`);
    }
    catch (err) {
      return next(err);
    }
  }
]
