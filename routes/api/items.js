const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const { Items } = require('../../models');

router.route('/')
// Retrieve all items
.get((req, res, next) => {
  Items.findAll({where: req.query })
  .then((items) => {
    return res.json(items);
  })
  .catch((err) => next(err));
})
// Create item
.post((req, res, next) => {
  const status = req.body.status;
  const innerbox = req.body.innerbox;
  const outerbox = req.body.outerbox;
  const ColorName = req.body.ColorName;
  const SizeName = req.body.SizeName;
  const FactoryOrderId = req.body.FactoryOrderId;
  const CustomerOrderId = req.body.CustomerOrderId;

  Items.create({
    status,
    innerbox,
    outerbox,
    ColorName,
    SizeName,
    FactoryOrderId,
    CustomerOrderId
  })
  .then((item) => {
    return res.json(item);
  })
  .catch(err => next(err));
});

router.get('/filter', (req, res, next) => {
  Items.findAll({ where: req.query })
  .then((items) => {
    return res.json(items);
  })
  .catch(err => next(err));
})

router.route('/:id')
// Retrieve single item
.get((req, res, next) => {
  const id = req.params.id;

  Items.findOne({ where: { id }})
  .then((item) => {
    return res.json(item);
  })
  .catch((err) => next(err));
})
// Create item with id
.post((req, res, next) => {
  const id = req.body.id;
  const status = req.body.status;
  const innerbox = req.body.innerbox;
  const outerbox = req.body.outerbox;
  const ColorName = req.body.ColorName;
  const SizeName = req.body.SizeName;
  const FactoryOrderId = req.body.FactoryOrderId;
  const CustomerOrderId = req.body.CustomerOrderId;

  Items.create({
    id,
    status,
    innerbox,
    outerbox,
    ColorName,
    SizeName,
    FactoryOrderId,
    CustomerOrderId
  })
  .then((item) => {
    return res.json(item);
  })
  .catch(err => next(err));
})
// Update item
.put((req, res, next) => {
  const id = req.params.id;

  const status = req.body.status;
  const innerbox = req.body.innerbox;
  const outerbox = req.body.outerbox;
  const ColorName = req.body.ColorName;
  const SizeName = req.body.SizeName;
  const FactoryOrderId = req.body.FactoryOrderId;
  const CustomerOrderId = req.body.CustomerOrderId;

  console.log(`status ${status}`)
  console.log(`innerbox ${innerbox}`)
  console.log(`outerbox ${outerbox}`)
  console.log(`ColorName ${ColorName}`)
  console.log(`SizeName ${SizeName}`)
  console.log(`FactoryOrderId ${FactoryOrderId}`)
  console.log(`CustomerOrderId ${CustomerOrderId}`)

  Items.findOne({ where: { id } })
  .then((item) => {
    if (status !== undefined) {
      item.status = status;
    }
    if (innerbox !== undefined) {
      if (innerbox)
        item.innerbox = innerbox;
      else
        item.innerbox = null;
    }
    if (outerbox !== undefined) {
      if (outerbox)
        item.outerbox = outerbox;
      else
        item.outerbox = null;
    }
    if (ColorName !== undefined) {
      item.ColorName = ColorName;
    }
    if (SizeName !== undefined) {
      item.SizeName = SizeName;
    }
    if (FactoryOrderId !== undefined) {
      if (FactoryOrderId)
        item.FactoryOrderId = FactoryOrderId;
      else
        item.FactoryOrderId = null;
    }
    if (CustomerOrderId !== undefined) {
      if (CustomerOrderId)
        item.CustomerOrderId = CustomerOrderId;
      else
        item.CustomerOrderId = null;
    }

    item.save().then((item) => {
      return res.json(item);
    });
  })
  .catch((err) => next(err));
})
// Delete item
.delete((req, res, next) => {
  const id = req.params.id;

  Items.destroy({ where: { id } })
  .then((count) => {
    return res.json(count);
  })
  .catch(err => next(err));
});

router.get('/factory_order/:id', (req, res, next) => {
  const FactoryOrderId = parseInt(req.params.id);

  Items.findAll({ where: { FactoryOrderId }})
  .then((items) => {
    return res.json(items);
  })
  .catch(err => next(err));
});

router.get('/customer_order/:id', (req, res, next) => {
  const CustomerOrderId = req.params.id;

  Items.findAll({ where: { CustomerOrderId }})
  .then((items) => {
    return res.json(items);
  })
  .catch(err => next(err));
});

module.exports = router;
