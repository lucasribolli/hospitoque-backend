const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();
const router = express.Router();
app.use(cors());
app.use(express.json());

const { MongoClient } = require('mongodb');
const HOSPITOQUE_DB_NAME = "hospitoque_db";

router.get('/', (req, res) => {
  res.json({
    'hello': 'hi!'
  });
});

// This section will help you get a list of all the records.
router.route('/listings').get(async function (_req, res) {
  const client = getClient();
  client.connect(async function (_) {
    const collection = client.db(HOSPITOQUE_DB_NAME).collection("matches");
    collection.find({})
      .limit(50)
      .toArray(function (err, result) {
        if (err) {
          res.status(500).send('Error fetching listings! ' + err);
        } else {
          res.json(result);
        }
      });
    });
    client.close();
});

function getClient() {
  // TODO: insert ATLAS_URI on config.env
  const connectionString = 'mongodb+srv://sipucmongodb:sipucmongodb@freecluster.c1vva8f.mongodb.net/?retryWrites=true&w=majority';
  return new MongoClient(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
}

app.use('/.netlify/functions/api', router);

module.exports = app;
module.exports.handler = serverless(app);