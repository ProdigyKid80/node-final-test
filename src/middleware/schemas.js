const Joi = require("joi");

const registrationSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required(),
});

const wineSchema = Joi.object({
  title: Joi.string().trim().required(),
  region: Joi.string().trim().required(),
  year: Joi.number().required(),
});

const collectionSchema = Joi.object({
  wine_id: Joi.number().required(),
  amount: Joi.number().required(),
});

module.exports = {
  registrationSchema,
  loginSchema,
  changePasswordSchema,
  wineSchema,
  collectionSchema,
};
