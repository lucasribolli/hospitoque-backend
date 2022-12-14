const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
ObjectID = require('mongodb').ObjectID;

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
const COLLECTION_DELETED_MEDICINE = 'deleted_medicines';
const COLLECTION_USERS = 'users';

router.route('/medicine').post(async function (req, res) {
  const medicine = {
    name: req.body.name,
    manufacturer: req.body.manufacturer,
    composition: req.body.composition,
    variant: req.body.variant,
    available: req.body.available,
    expirationDate: req.body.expirationDate,
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

router.route('/medicine').delete(async function (req, res) {
  const idsString = req.body.ids;
  console.log('idsString: ' + idsString);
  const idsObject = idsString.map(function(id) {
    return new ObjectID(id);
  });
  console.log('idsObject: ' + idsObject);

  const idsFilter = {
    _id: { $in: idsObject }
  };
  
  const client = getClient();
  client.connect(async function (_) {
    const medicineCollection = client.db(HOSPITOQUE_DB_NAME).collection(COLLECTION_MEDICINE);

    medicineCollection.find(idsFilter)
      .toArray(function (err1, idsFilterResult) {
        if (!err1) {
          // TODO idsFilterResult -> [object Object]
          console.log(`Medicines: ` + Object.prototype.toString.call(idsFilterResult));

          const deletedMedicineCollection = client.db(HOSPITOQUE_DB_NAME).collection(COLLECTION_DELETED_MEDICINE);
          var deletedMedicine = {
            medicines: idsFilterResult,
            date: new Date()
          };
          if(req.body.reason != null) {
            deletedMedicine.reason = req.body.reason;
          }
          deletedMedicineCollection.insertOne(deletedMedicine, function (err2, resultInsertion) {
            console.log(`Medicines inserted on deleted_medicines: result: ` + resultInsertion + ` err2: ` + err2);
            medicineCollection.deleteMany(idsFilter, function (err3, result) {
              if (err3) {
                res.status(400).send('Error deleting medicines! ' + err3);
              } else {
                console.log(`Medicines deleted: ` + result);
                res.send();
              }
            });
          });
        }
      });
  });
  client.close();
});

router.route('/medicine').get(async function (req, res) {
  var q = req.query.q
  const client = getClient();
  client.connect(async function (_) {
    const collection = client.db(HOSPITOQUE_DB_NAME).collection(COLLECTION_MEDICINE);
    collection
      .find({ 
        $or: [
          {
            name: { $regex : q }
          }, 
          { 
            manufacturer: { $regex : q }
          },
          {
            composition: { $regex : q }
          }
        ] 
      })
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

router.route('/auth').get(async function (req, res) {
  var email = req.query.email
  const client = getClient();
  client.connect(async function (_) {
    const collection = client.db(HOSPITOQUE_DB_NAME).collection(COLLECTION_USERS);
    collection
      .find({
        email: email
      })
      .toArray(function (err, result) {
        if (err) {
          res.status(400).send('Error on auth ' + err);
        } else {
          res.json({
            authorized: result.length > 0
          });
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