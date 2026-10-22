import Joi from 'joi';

export const createClassSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    description: Joi.string().trim().min(10).max(5000).required(),
    academyName: Joi.string().trim().max(200).allow('').optional(),
    category: Joi.string().required(),
    price: Joi.number().min(0).required().messages({ 'number.min': 'Price cannot be negative', 'number.base': 'Enter a valid price' }),
    priceUnit: Joi.string().valid('month', 'session', 'hour', 'week').default('month'),
    schedule: Joi.string().allow('').optional(),
    time: Joi.string().allow('').optional(),
    ageGroup: Joi.string().allow('').optional(),
    skillLevel: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'All Levels').default('All Levels'),
    maxStudents: Joi.number().min(1).max(1000).default(200),
    trialAvailable: Joi.boolean().default(false),
    trialPrice: Joi.number().min(0).default(0),
    trialSlots: Joi.array().items(Joi.string().trim().max(100)).default([]),
    pricingTiers: Joi.object({
      first50: Joi.number().min(0).optional(),
      next100: Joi.number().min(0).optional(),
      standard: Joi.number().min(0).optional(),
    }).optional(),
  }),
};

export const updateClassSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(3).max(200),
    description: Joi.string().trim().min(10).max(5000),
    academyName: Joi.string().trim().max(200).allow(''),
    category: Joi.string(),
    price: Joi.number().min(0).messages({ 'number.min': 'Price cannot be negative', 'number.base': 'Enter a valid price' }),
    priceUnit: Joi.string().valid('month', 'session', 'hour', 'week'),
    schedule: Joi.string().allow(''),
    time: Joi.string().allow(''),
    ageGroup: Joi.string().allow(''),
    skillLevel: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'All Levels'),
    maxStudents: Joi.number().min(1).max(1000),
    trialAvailable: Joi.boolean(),
    trialPrice: Joi.number().min(0),
    trialSlots: Joi.array().items(Joi.string().trim().max(100)),
    isActive: Joi.boolean(),
  }).min(1),
};

export const createReviewSchema = {
  body: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    text: Joi.string().trim().min(5).max(1000).required(),
  }),
};
