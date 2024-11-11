const Joi = require('joi');

module.exports.guideschema=Joi.object({
    hi2:Joi.object({
        name:Joi.string().required(),
        description:Joi.string().required(),
        location:Joi.string().required(),
        state:Joi.string().required(),
        country:Joi.string().required().min(0),
        image:Joi.string().allow("",null),


    }).required(),
});


module.exports.reviewschema=Joi.object({
    review:Joi.object({
        rating:Joi.number().required().min(1).max(5),
        comment:Joi.string().required(),


    }).required()
})

module.exports.messageschema=Joi.object({
    message:Joi.object({
        information:Joi.string().required()
    }).required()
});