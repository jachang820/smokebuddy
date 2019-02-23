const to = require('./to');
const { sequelize } = require('../models');

class BaseRepo {

  constructor(Model, key) {
    this.Model = Model;

    /* Set primary key. */
    if (key) this.key = key;

    /* Set transaction for multiple queries. */
    this.tx = null;

    /* Cache recent queries. Useful in some cases. */
    this.cache = {};

    /* Associated repos. */
    this.assoc = null;
  }

  /* Sequelize options.
     Set 'offset' to 0 to turn off limiting. */
  async _list(options = {}) {

    /* Looks for an extra record past the limit to determine
       last page. */
    if (options.offset > 0) {
      if (!options.limit) options.limit = 21;
      else options.limit += 1;
    } else {
      options.offset = 0;
      delete options.limit;
    }

    let models, err;
    [err, models] = await to(this.Model.findAll(options));
    if (err) BaseRepo._handleErrors(err);

    this.cache.list = models;
    if (!models) return [];
    else return models.map(e => e.get({ plain: true }));
  }

  async _get(options) {
    let model, err;
    [err, model] = await to(this.Model.findOne(options));
    if (err) BaseRepo._handleErrors(err);
    
    this.cache.get = model;
    if (!model) return null;
    else return model.get({ plain: true });
  }

  async _create(modelObj) {
    let model, err;

    /* Use bulkCreate if an array of objects passed in. */
    if (Array.isArray(modelObj)) {
     [err, model] = await to(this.Model.bulkCreate(modelObj, {
      validate: true,
      individualHooks: true,
      returning: true
     }));
    } else {
      [err, model] = await to(this.Model.create(modelObj));  
    }
    if (err) BaseRepo._handleErrors(err);

    this.cache.create = model;
    if (!model || model.length === 0) {
      return Array.isArray(model) ? [] : null;
    } else {
      if (Array.isArray(model)) {
        return model.map(e => e.get({ plain: true }));
      } else {
        return model.get({ plain: true });
      }
    }
  }

  async _update(query, options) {
    let ret, err;
    let opts = Object.assign({ returning: true }, options);

    [err, ret] = await to(this.Model.update(query, opts));
    if (err) BaseRepo._handleErrors(err);
    let [count, models] = ret;

    this.cache.update = models;
    models.map(e => e.get({ plain: true }));
    return models;
  }

  async _use(options, used) {
    const query = { hidden: null, used: used };
    let opts = Object.assign({ paranoid: false }, options);
    return this._update(query, opts);
  }

  async _delete(options, permanent) {
    const findOpts = Object.assign({ paranoid: false }, options);

    let model, err;
    [err, model] = await to(this.Model.findOne(findOpts));
    if (err) BaseRepo._handleErrors(err);

    let destroyOpts;
    if (!model.used && permanent) {
      destroyOpts = { force: true };
    } else {
      destroyOpts = {};
    }

    [err] = await to(model.destroy(destroyOpts));
    if (err) BaseRepo._handleErrors(err);

    this.cache.delete = model;
    if (!model) return null;
    else {
      return model.get({ plain: true });
    }
  }

  async active(id) {
    if (this.Model.rawAttributes.hidden === undefined) {
      return true;
    }
    let key = this.key || this.cache.pk || this.getPK();
    let options = { where: {} };
    options.where[key] = id;
    options.paranoid = false;
    
    let model, err;
    [err, model] = await to(this.Model.findOne(options));
    if (err) BaseRepo._handleErrors(err);
    this.cache.active = model;

    if (!model) return null;
    else return !model.get({ plain: true }).hidden;
  }

  _describe(exclude) {
    let columns = {};
    if (!Array.isArray(exclude)) exclude = [exclude];
    for (let key in this.Model.rawAttributes) {
      const attr = this.Model.rawAttributes[key];
      if (exclude.includes(key)) {
        continue;
      }
      columns[key] = {};
      columns[key].type = attr.type.key.toLowerCase();
      columns[key].optional = attr.allowNull || false;
    }
    return columns;
  }

  getPK() {
    for (let key in this.Model.rawAttributes) {
      const attr = this.Model.rawAttributes[key];
      if (attr.primaryKey) {
        this.cache.pk = key;
        return key;
      }
    }
    BaseRepo._handleErrors(new Error("No primary key?!"),
      null, true);
  }

  transaction(fun, transaction) {
    const tx = { transaction: transaction };
    if (transaction) {
      return sequelize.transaction(tx, fun)
        .catch(err => Promise.reject(err));
    } else {
      return sequelize.transaction(fun)
        .catch(err => Promise.reject(err));
    }
  }

  static _handleErrors(err, param, critical = false) {
    let newErr = new Error();
    newErr.name = 'ValidationError';
    newErr.status = 500;
    newErr.stack = err.stack;
    newErr.errors = [];
    switch (err.name) {
      case 'SequelizeValidationError':
        for (let i = 0; i < err.errors.length; i++) {
          newErr.errors.push({
            msg: err.errors[i].message,
            param: err.errors[i].path
          });
        }
        break;

      case 'SequelizeForeignKeyConstraintError':
        const path = err.index.split('_')[1];
        newErr.errors.push({
          msg: `Invalid ${path} selected.`,
          param: path
        });
        break;

      case 'SequelizeUniqueConstraintError':
        for (let i = 0; i < err.errors.length; i++) {
          const path = err.errors[i].path;
          const cap_path = path.charAt(0).toUpperCase() + path.substr(1);
          newErr.errors.push({
            msg: `${cap_path} already in use.`,
            param: err.errors[i].path
          });
        }
        break;

      default:
        if (critical) {
          newErr.errors = 'unknown';
        } else {
          newErr.errors.push({
            msg: err.message,
            param
          });
        }
    }
    console.log(newErr);
    throw newErr;
  }

  static insertDateRange(whereObj) {
    if (!whereObj) return whereObj;
    
    const keys = Object.keys(whereObj);
    for (let i = 0; i < keys.length; i++) {
      let value = whereObj[keys[i]];
      if (Array.isArray(value)) {
        value = { [sequelize.Op.between] : value };
        whereObj[keys[i]] = value;
      }
    }
    return whereObj;
  }

  static buildFilterString(filter) {
    let where = '';
    if (typeof filter === 'object' && filter !== null && filter.length > 0) {

      where = 'WHERE ' + Object.entries(filter)
      .map(e => {
        let str = `"Item"."${e[0]}" `; 
        if (Array.isArray(e[1])) {
          return str + `BETWEEN '${e[1][0]}' AND '${e[1][1]}'`;
        } else {
          return str + `= '${e[1]}'`;
        }
      }).join(' AND ');
    } else if (typeof filter === 'string') {
      where = 'WHERE ' + by;
    }
    return where;
  }

  get associate() {
    return this.assoc;
  }
}

module.exports = BaseRepo;