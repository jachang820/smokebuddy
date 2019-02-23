const BaseService = require('./base');
const ColorRepo = require('../repos/color');

class Colors extends BaseService {

  constructor() {
    super(ColorRepo);
  }

  async getListView(page = 1, order, desc, filter) {
    return this._getListView(page, order, desc, filter);
  }

  async getSchema() {
    let schema = await this._getSchema();
    schema.abbrev.alias = "Label Abbreviation";
    schema.abbrev.explanation = 
      "Abbreviation printed on label template.";
    return schema;
  }

  async get(id) {
    return this._get(id);
  }

  async changeState(id) {
    const color = await this._get(id);
    return this._changeState(color, id);
  }

  async add(name, abbrev) {
  	name = Colors.toTitleCase(name);
  	abbrev = abbrev.toUpperCase();
    return this._add(Array.from(arguments));
  }

};

module.exports = Colors;