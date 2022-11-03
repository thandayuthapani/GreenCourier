const connection = require("../connections/mysql");
const {
  responseError,
  responseSystemError,
} = require("../utils/express_utils");
const Users = require("../models/UsersModel");
const Consumers = require("../models/ConsumersModel");
const Sensors = require("../models/SensorsModel");
const Devices = require("../models/DevicesModel");
const jwt = require("jsonwebtoken");
const { CONSUMER_SECRET } = require("../secrets");
const bcrypt = require("bcryptjs");
const BaseController = require("./BaseController");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const controller = new (class extends BaseController {
  constructor() {
    super(Consumers);
    this.findAllOptions = {
      include: [{ model: Sensors, include: [{ model: Devices }] }],
    };
  }
  getAll(req, res) {
    if (req.authenticated_as.id === -1) {
      Consumers.findAll({
        include: [{ model: Sensors, include: [{ model: Devices }] }],
      })
        .then((datas) => {
          return res.status(200).json({ result: datas });
        })
        .catch((err) => responseError(res, err));
    } else {
      Users.findById(req.authenticated_as.id)
        .then((user) => {
          if (!user) {
            return res.status(400).json({
              name: "UserNotFound",
              errors: [{ message: "User not found" }],
            });
          } else {
            console.log("Finding consumers for user : ", user.id);
            Consumers.findAll({
              where: { userId: { [Op.eq]: user.id } },
              include: [{ model: Sensors, include: [{ model: Devices }] }],
            })
              .then((datas) => {
                console.log("Consumers found: ", datas);
                return res.status(200).json({ result: datas });
              })
              .catch((err) => responseError(res, err));
          }
        })
        .catch((err) => responseError(res, err));
    }
  }
  add(req, res) {
    Users.findById(req.authenticated_as.id)
      .then((user) => {
        if (!user) {
          return res.status(400).json({
            name: "UserNotFound",
            errors: [{ message: "User not found" }],
          });
        } else {
          Consumers.create({
            name: req.body.name,
            description: req.body.description,
            userId: user.id,
          })
            .then((data) => {
              this.post_add(data, (result_data) => {
                return res.status(200).json({ result: result_data });
              });
            })
            .catch((err) => responseError(res, err));
        }
      })
      .catch((err) => responseError(res, err));
  }

  update(req, res) {
    Users.findById(req.authenticated_as.id)
      .then((user) => {
        if (!user) {
          console.log("consumer Update: UserNotFound");
          return res.status(400).json({
            name: "UserNotFound",
            errors: [{ message: "User not found" }],
          });
        } else {
          console.log("consumer Update: User Found");
          Consumers.findOne({
            where: {
              userId: { [Op.eq]: user.id },
              id: { [Op.eq]: req.params.id },
            },
          }).then((data) => {
            if (data) {
              console.log("consumer Update: consumer Found");
              delete req.body.id;
              Consumers.update(req.body, {
                where: { id: { [Op.eq]: data.id } },
              })
                .then((device) => {
                  return res.status(200).json({ result: device });
                })
                .catch((err) => responseError(res, err));
            } else {
              console.log("Consumer Update: Consumer Not Found");
              return res.status(400).json({
                name: "ConsumerNotFound",
                errors: [{ message: "Consumer not found" }],
              });
            }
          });
        }
      })
      .catch((err) => responseError(res, err));
  }

  pre_delete(req, res, callback) {
    callback();
  }

  delete(req, res) {
    this.pre_delete(req, res, () => {
      this.model
        .destroy({
          where: {
            userId: { [Op.eq]: req.authenticated_as.id },
            id: { [Op.eq]: req.params.id },
          },
        })
        .then((data) => {
          return res.status(200).json({ result: data });
        })
        .catch((err) => responseError(res, err));
    });
  }

  key(req, res) {
    if(req.authenticated_as.id === -1){
      this.findAllOptions = {
        where: {
          id: { [Op.eq]: req.params.id },
        },
      };
    }else{
      this.findAllOptions = {
        where: {
          userId: { [Op.eq]: req.authenticated_as.id },
          id: { [Op.eq]: req.params.id },
        },
      };
    }
    Consumers.findOne(this.findAllOptions).then((consumer) => {
      if (consumer) {
        jwt.sign({}, CONSUMER_SECRET,
          {
            algorithm: "RS256",
            issuer: "iotplatform",
            subject: "" + consumer.userId.toString() + "_" + consumer.id.toString(),
          }, (err, token) => {
            return res.json({token, user_id: consumer.userId, consumer_id: consumer.id,});
          });
      } else {
        return res.status(400).json({name: "ConsumerNotFound", errors: [{ message: "Consumer not found" }]});
      }
    }).catch((err) => responseError(res, err));
  }
})();

module.exports = {
  getAll: controller.getAll.bind(controller),
  add: controller.add.bind(controller),
  update: controller.update.bind(controller),
  delete: controller.delete.bind(controller),
  key: controller.key.bind(controller),
};
