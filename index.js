const express = require('express');
const cors = require('cors')
const app = express()
const port = 9000
require('dotenv').config()

app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.get('/', (req, res) => {
  res.send('Hello World!')
})



const uri = process.env.MONGO_DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("legalEase");
    const jobCollection = database.collection("jobs");
    const companyCollection = database.collection("companies")
    const usersCollection = database.collection("user")
    const hireCollection = database.collection("hires")
    const requestCollection = database.collection("requests")
    const commentCollection = database.collection("comments")
    const paymentCollection = database.collection("payments")
    // payment related api


    app.post("/api/payments", async (req, res) => { 
      const payment = req.body;
      cosnt newPayment = {
        ...payment,
        createAt: new Date()
      }
      const result = await paymentCollection.insertOne(newPayment);
      res.send(result);
    })

    // comments related api
    app.delete("/api/comments/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await commentCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send({
          success: true,
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          error: error.message,
        });
      }
    });

    app.get("/api/comments", async (req, res) => {
      try {
        const query = {};

        if (req.query.hireId) {
          query.hireId = req.query.hireId;
        }
        const result = await commentCollection
          .find(query, {
            projection: {
              text: 1,
            },
          })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });


    app.post("/api/comments", async (req, res) => {
      const commentData = {
        ...req.body,
        createdAt: new Date(),
      };

      const result = await commentCollection.insertOne(commentData);

      res.send(result);
    });

    // job Collection related api
    app.delete("/api/jobs/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await jobCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send({
          success: true,
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          error: error.message,
        });
      }
    });
    app.delete("/api/jobs/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await jobCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send({
          success: true,
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          error: error.message,
        });
      }
    });


    app.get('/api/jobs', async (req, res) => {
      const query = {};

      if (req.query.companyId) query.companyId = req.query.companyId;
      if (req.query.status) query.status = req.query.status;
      if (req.query.lawyerId) query.lawyerId = req.query.lawyerId;
      console.log("Searching for lawyerId:", query.lawyerId);
      if (req.query.clientId) query.clientId = req.query.clientId;

      try {

        const result = await jobCollection.find(query).toArray();
        console.log("Database result count:", result.length);
        res.send(result || []);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });


    app.get('/api/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      }
      const result = await jobCollection.findOne(query);
      res.send(result)
    })


    app.post('/api/jobs', async (req, res) => {
      const job = req.body;
      const newJob = {
        ...job,
        createAt: new Date()
      }
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
    });


    // application related api

    app.patch('/api/hires/:id', async (req, res) => {
      const id = req.params.id;
      const updateHires = req.body
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: updateHires.status
        }
      }
      const result = await hireCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


    app.get('/api/hires', async (req, res) => {
      const cursor = hireCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/api/hires/:id', async (req, res) => {
      const id = req.params.id;

      const result = await hireCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result || {});
    });

    app.get('/api/hires', async (req, res) => {
      const query = {};
      if (req.query.clientId) {
        query.clientId = req.query.clientId;
      }
      if (req.query.lawyerId) {
        query.lawyerId = req.query.lawyerId
      }
      if (req.query.userId) {
        query.userId = req.query.userId
      }
      const cursor = hireCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);

    })

    app.post('/api/hires', async (req, res) => {
      const hire = req.body;
      console.log("hire", hire);
      const existing = await hireCollection.findOne({
        lawyerId: hire.lawyerId,
        clientId: hire.clientId,
      });

      if (existing) {
        return res.send({
          acknowledged: false,
          alreadyExists: true,
          hire: existing,
        });
      }
      const newHire = {
        ...hire,
        createAt: new Date()
      }
      const result = await hireCollection.insertOne(newHire);
      res.send(result)
    })

    app.patch("/api/hires/:id/paid", async (req, res) => {
      try {
        const id = req.params.id;

        const existing = await hireCollection.findOne({
          _id: new ObjectId(id),
        });

        if (existing?.status === "paid") {
          return res.send({
            success: true,
            message: "Already paid",
          });
        }

        const result = await hireCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "paid",
              paidAt: new Date(),
            },
          }
        );
        console.log(result);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });
    app.patch('/api/hires/:id/accept', async (req, res) => {
      try {
        const id = req.params.id;

        const result = await hireCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "accepted",
              acceptedAt: new Date(),
            },
          }
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });


    // requests related api
    app.get("/api/my/requests/:id", async (req, res) => {
      const result = await requestCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      console.log(result, 'hiredata from api :id');
      res.send(result);
    });


    app.get('/api/my/requests', async (req, res) => {
      const query = {};
      if (req.query.lawyerId) {
        query.lawyerId = req.query.lawyerId;
      }
      const result = await requestCollection.findOne(query);
      console.log(lawyerId, 'lawyerData from api');
      res.send(result || {})
    })


    app.post('/api/requests', async (req, res) => {
      const request = req.body;
      const newRequest = {
        ...request,
        createAt: new Date()
      }
      const result = await requestCollection.insertOne(newRequest);
      res.send(result)
    })

    // company related api
    app.get('/api/companies', async (req, res) => {
      const cursor = companyCollection.find().skip(4)
      const result = await cursor.toArray();
      res.send(result || {});
    })


    app.get('/api/my/companies', async (req, res) => {
      const query = {};
      console.log("query", query);
      if (req.query.clientId) {
        query.clientId = req.query.clientId;
      }
      if (req.query.lawyerId) {
        query.lawyerId = req.query.lawyerId;
      }
      if (req.query.userId) {
        query.userId = req.query.userId;
      }

      const result = await companyCollection.findOne(query);
      console.log(result);
      res.send(result || {});
    })


    app.post('/api/companies', async (req, res) => {
      const company = req.body;
      const newCompany = {
        ...company,
        createdAt: new Date()
      }
      const result = await companyCollection.insertOne(company);
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})