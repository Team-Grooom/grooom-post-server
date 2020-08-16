const swaggerJSDoc = require('swagger-jsdoc');

var swaggerDefinition = {
    info : {
        title : "groom-post-server",
        version : "1.0.0",
        description : "groom-post-server API DOCs"
    },
    host : "localhost:3000",
    basePath : "/"
};

var options = {
    swaggerDefinition: swaggerDefinition,
    apis : ['../routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;