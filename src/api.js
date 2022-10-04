const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();
const router = express.Router();
app.use(cors());
app.use(express.json());

const { MongoClient } = require('mongodb');
const HOSPITOQUE_DB_NAME = 'hospitoque_db';

router.get('/', (req, res) => {
  res.json({
    'hospitoque': 'hospitoque'
  });
});

const COLLECTION_MEDICINE = 'medicines';

router.route('/medicine').post(async function (req, res) {
  const medicine = {
    name: req.body.name,
    manufacturer: req.body.manufacturer,
    composition: req.body.composition,
    variant: req.body.variant,
    creationDate: new Date()
  };
  
  const client = getClient();
  client.connect(async function (_) {
    const collection = client.db(HOSPITOQUE_DB_NAME).collection(COLLECTION_MEDICINE);
    collection.insertOne(medicine, function (err, result) {
      if (err) {
        res.status(400).send('Error inserting medicine!');
      } else {
        console.log(`Added a new medicine with id ${result.insertedId}`);
        res.send();
      }
    });
  });
  client.close();
});

// This section will help you get a list of all the records.
router.route('/medicine').get(async function (_, res) {
  const client = getClient();
  client.connect(async function (_) {
    const collection = client.db(HOSPITOQUE_DB_NAME).collection(COLLECTION_MEDICINE);
    collection
      .find({})
      .toArray(function (err, result) {
        if (err) {
          res.status(400).send('Error fetching medicine!');
        } else {
          res.json(result);
        }
      });
    })
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