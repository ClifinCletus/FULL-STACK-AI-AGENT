import Joi from 'joi'

/**
 * - email must be a valid email
 * - password must be at least 6 characters
 * - skills must be an array of strings
 */
export const signupSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  skills: Joi.array().items(Joi.string()).default([]),
})


/**
 * - email must be a valid email
 * - password must be at least 6 characters
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be valid',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
})


/**
 * - email (to identify the user)
 * - optional new role (must be one of the enum)
 * - optional skills array
 */
export const updateUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Valid user email is required for update',
    'any.required': 'Email is required',
  }),
  role: Joi.string().valid('user', 'admin', 'moderator').optional(),
  skills: Joi.array().items(Joi.string()).optional(),
})
