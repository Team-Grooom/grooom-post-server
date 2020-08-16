const {Client} = require('@elastic/elasticsearch');

const client = new Client({
    node : process.env.ELASTICSEARCH_CLIENT // elasticsearch container ip
})

module.exports = client;