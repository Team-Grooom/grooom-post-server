const swaggerJSDoc = require('swagger-jsdoc');

var swaggerDefinition = {
    info : {
        title : "grooom-post-server",
        version : "1.0.0",
        description : "grooom-post-server API DOCs"
    },
    host : "localhost:3000",
    basePath : "/"
};

var options = {
    swaggerDefinition: swaggerDefinition,
    apis : [__dirname + '/../routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;