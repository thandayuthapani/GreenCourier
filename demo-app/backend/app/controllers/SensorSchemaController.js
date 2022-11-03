const BaseController = require("./BaseController");
const Sequelize = require("sequelize");
const Schema = require("../models/SensorSchema");
const SensorModel = require('../models/SensorsModel');
const Sensors = require("./DeviceSensorsController");
const {genericResponse} = require('../utils/express_utils');
const { deleteTopic } = require("../connections/kafka");
const { deleteConnectJob } = require("../connections/connect");
const { deleteElasticsearchIndex } = require("../connections/elasticsearch");

const controller = new (class extends BaseController {
  constructor() {
    super(Schema);
  }

  async createDefaultSchema() {
    const schemas = await this.model.findAll(this.findAllOptions);
    if (schemas.length !== 0) {
      return;
    }
    console.log("Creating simple default schema");
    await this.model.create({
      name: "Simple number value",
      description: "expects an simple number value",
      schema: JSON.stringify({
        type: "struct",
        optional: false,
        fields: [
          {
            field: "value",
            optional: false,
            type: "double",
          },
        ],
      }),
    });
  }

  async delete(req, res) {
    try {
      let sensors = await SensorModel.findAll({where: {schemaId: req.params.id}});
      await SensorModel.destroy({where: {schemaId: req.params.id}});
      await Schema.destroy({where: {id: req.params.id}});
      for(let sensor in sensors) {
        let topic = `${req.authenticated_as.id}_${sensor.deviceId}_${sensor.id}`;
        await deleteConnectJob(topic);
        await deleteTopic(topic);
        await deleteElasticsearchIndex(topic);
        return res.sendStatus(200);
      }
    } catch (err) {
      return genericResponse(res, 'deleteSchemaError', err, 500);
    }
  }
})();

module.exports = {
  getAll: controller.getAll.bind(controller),
  add: controller.add.bind(controller),
  update: controller.update.bind(controller),
  delete: controller.delete.bind(controller),
  createDefaultSchema: controller.createDefaultSchema.bind(controller),
};
