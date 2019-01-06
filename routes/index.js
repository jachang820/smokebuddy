const express = require('express');
const router = express.Router();
const secured = require('../middleware/secured');
const auth = require('../middleware/authorize');

const indexGet = require('./controllers/indexGet');
const dashboardGet = require('./controllers/dashboardGet');

const apiRouter = require('./api/index');
const authRouter = require('./auth');
const customerOrdersRouter = require('./customer_orders');
const inventoryRouter = require('./inventory');
const itemRouter = require('./item');
const ordersRouter = require('./orders');
const profileRouter = require('./profile');
const qrCodeRouter = require('./qr_code');
const scanRouter = require('./scan');
const stylesRouter = require('./styles');

/* Public pages. */

/* GET home page. */
router.get('/', indexGet);
router.use('/auth', authRouter);

/* Temporary public pages (for testing purposes). */
router.use('/qr', qrCodeRouter);

const setupAxios = require('../helpers/setupAxios');
router.get('/test', async (req, res, next) => {
	const axios = setupAxios();
	let response = await axios.get('/items');
	console.log(response.data);
	next();
});

/* Protected pages. */
router.use(secured);
router.use('/api', apiRouter);
router.use('/item', itemRouter);
router.use('/inventory', inventoryRouter);
router.use('/orders', auth(['A']), ordersRouter);
router.use('/profile', profileRouter);
router.use('/scan', scanRouter);
router.use('/customer_orders', customerOrdersRouter);
router.use('/styles', auth(['A']), stylesRouter);

/* GET dashboard. */
router.get('/dashboard', dashboardGet);

module.exports = router;
