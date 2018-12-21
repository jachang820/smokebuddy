const express = require('express');
const router = express.Router();
const { CustomerOrders } = require('../../models')

router.route('/')
// Retrieve all customer orders
.get((req, res, next) => {
  CustomerOrders.findAll()
  .then((customerOrders) => {
    res.json(customerOrders);
  })
  .catch(next);
})
// Create customer order
.post((req, res, next) => {
  const label = req.body.label;
  const arrival_date = req.body.arrival_date;
  const notes = req.body.notes;

  CustomerOrders.create({
    label,
    arrival_date,
    notes
  })
  .then((customerOrder) => {
    res.json(customerOrder);
  })
  .catch(next);
});

router.route('/:id')
// Retrieve single customer order
.get((req, res, next) => {
  const id = req.params.id;

  CustomerOrders.findOne({ where: { id }})
  .then((customerOrder) => {
    res.json(customerOrder);
  })
  .catch(next);
})
// Update customer order
.put((req, res, next) => {
  const id = req.params.id;
  const label = req.body.label;
  const arrival_date = req.body.arrival_date;
  const notes = req.body.notes;

  CustomerOrders.find({ where: { id } })
  .then((customerOrder) => {
    if (label !== undefined)
      customerOrder.label = label;
    if (arrival_date !== undefined)
      customerOrder.arrival_date = arrival_date;
    if (notes !== undefined)
      customerOrder.notes = notes;

    customerOrder.save()
    .then((customerOrder) => {
      res.json(customerOrder);
    })
  })
  .catch(next);
})
.delete((req, res, next) => {
  const id = req.params.id;

  CustomerOrders.destroy({ where: { id }})
  .then((count) => {
    res.json(count);
  })
  .catch(next);
});

module.exports = router;