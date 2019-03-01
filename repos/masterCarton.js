const BaseRepo = require('./base');
const { MasterCarton, Sku, Size, sequelize } = require('../models');

class MasterCartonRepo extends BaseRepo {

  constructor(exclude = []) {
    super(MasterCarton);

    exclude.push('masterCarton');
    
    this.assoc = {};
    if (!exclude.includes('sku')) {
      const SkuRepo = require('./sku');
      this.assoc.sku = new SkuRepo(exclude);
    }
    if (!exclude.includes('factoryOrder')) {
      const FactoryOrderRepo = require('./factoryOrder');
      this.assoc.factoryOrder = new FactoryOrderRepo(exclude);
    }
    if (!exclude.includes('innerCarton')) {
      const InnerCartonRepo = require('./innerCarton');
      this.assoc.innerCarton = new InnerCartonRepo(exclude);
    }
  }

  async expandData(factoryOrderId) {
    let query = `
      SELECT 
        serial AS "Master Carton", 
        UPPER(sku) AS "SKU",
        "Size"."masterSize" AS "Master/Inner",
        "Size"."innerSize" AS "Inner/Unit",
        SUM("Size"."innerSize" * "Size"."masterSize") AS count
      FROM "MasterCarton"
        LEFT JOIN "Sku" ON "MasterCarton".sku = "Sku".id
        LEFT JOIN "Size" ON "Sku"."sizeId" = "Size".id
      WHERE "factoryOrderId" = '${factoryOrderId}' 
      GROUP BY "MasterCarton".serial, "MasterCarton".sku, "Size"."innerSize", "Size"."masterSize"
      ORDER BY "MasterCarton".serial ASC
    `.replace(/\s+/g, ' ').trim();

    const cartons = await sequelize.query(query);
    this.cache.list = cartons;
    if (!cartons[0]) return [];
    return cartons[0];
  }

  async get(serial) {
    // Not sure how to implement this yet.
  }

  /* Cartons is a list in the format
     [...{sku, factoryOrderId}] */
  async create(cartons, transaction) {
    return this.transaction(async (t) => {
      return this._create(cartons);
    }, transaction);
  }

  async stock(id, transaction) {
    return this.transaction(async (t) => {
      return this.assoc.innerCarton.stock(id, t);
    });
  }

  async use(id, transaction) {
    return this.transaction(async (t) => {
      let master = await this._use({ 
        where: { factoryOrderId: id }
      }, true);
      master = master.map(e => e.get({ plain: true }));

      for (let i = 0; i < master.length; i++) {
        const inner = await this.assoc.innerCarton.use(
          master[i].id, t);
        master[i].innerCartons = inner;
      }
      return master;
    }, transaction);
  }

  async hide(id, transaction) {
    return this.transaction(async (t) => {
      const master = await this._delete({
        where: { factoryOrderId: id } 
      }, false);

      for (let i = 0; i < master.length; i++) {
        const inner = await this.assoc.innerCarton.hide(
          master[i].id, t);
      }
      return master;
    }, transaction);
  }

  describe() { return this._describe(); }

};

module.exports = MasterCartonRepo;