const express = require("express");
const cors = require("cors");
require("dotenv").config();
// const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());





const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://mans:${process.env.DB_PASS}@cluster0.toqnk.mongodb.net/?appName=Cluster0`;

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

        const userCollection = client.db("mansDB").collection("allusers");
        const newspostCollection = client.db("mansDB").collection("newspost");

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });

        
        // news post create
        app.post('/newspost', async (req, res) => {
            const news = req.body;
            const result = await newspostCollection.insertOne(news);
            res.send(result);
        })
        // news post api 
        app.get('/newspost', async (req, res) => {
            try {
              const cursor = newspostCollection.find();
              const result = await cursor.toArray();
              res.status(200).json(result);
            } catch (err) {
              console.error('Error in GET /newspost:', err);
              res.status(500).json({ error: err.message || 'Server error' });
            }
          });

        // user api read
        app.get('/user', async (req, res) => {
            const cursor = userCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // users api create
        app.post('/user', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// Sample Route
app.get("/", (req, res) => {
    res.send(" mans Server is running...");
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
