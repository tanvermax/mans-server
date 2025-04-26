const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://mans:${process.env.DB_PASS}@cluster0.toqnk.mongodb.net/?appName=Cluster0`;
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


        const verifytoken = (req, res, next) => {
            // console.log("inside verytoken", req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unathorized access' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.JWT_ACCES_TOKEN, (error, decoded) => {
                if (error) {
                    return res.status(401).send({ message: 'forbidden access' })
                }
                req.decoded = decoded;
                next();
            })
        }
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;  // Extract email from decoded token
            const query = { email: email };
      
            // Fetch user from databasenot
            const user = await userCollection.findOne(query);
      
            if (!user) {
              return res.status(404).send({ message: 'User not found' });
            }
      
            // Check if user has admin role
            const isAdmin = user.role === 'admin';
            if (!isAdmin) {
              return res.status(403).send({ message: 'Forbidden access: You are not an admin' });
            }
      
            next();
          };

        // veryfy token
        app.post('/jwt', (req, res) => {
            try {
              const user = req.body;
              console.log(user);
              
              const token = jwt.sign(user, process.env.JWT_ACCES_TOKEN, { expiresIn: '5h' });
              res.cookie('access-token', token);
              res.json({ message: 'token generated successfully', token });
            } catch (error) {
              console.error('error generated JWT:', error);
              res.status(500).json({ error: 'Internal server Error' });
            }
          });
          

        // News post API
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

        // for make user 
        app.patch('/user/user/:id', verifytoken, async (req, res) => {
            const id = req.params.id;
            console.log("Received PATCH request for user ID:", id);
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: { role: 'user' }
            };

            try {
                const result = await userCollection.updateOne(filter, updatedDoc);
                if (result.modifiedCount > 0) {
                    res.send({ success: true, message: "User role updated to user" });
                } else {
                    res.status(404).send({ success: false, message: "User not found or role already 'admin'" });
                }
            } catch (error) {
                console.error("Error updating role:", error);
                res.status(500).send({ success: false, message: "Internal server error" });
            }
        });

        // For admin API
        app.patch('/user/admin/:id', verifytoken, async (req, res) => {
            const id = req.params.id;
            console.log("Received PATCH request for user ID:", id);
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: { role: 'admin' }
            };

            try {
                const result = await userCollection.updateOne(filter, updatedDoc);
                if (result.modifiedCount > 0) {
                    res.send({ success: true, message: "User role updated to admin" });
                } else {
                    res.status(404).send({ success: false, message: "User not found or role already 'admin'" });
                }
            } catch (error) {
                console.error("Error updating role:", error);
                res.status(500).send({ success: false, message: "Internal server error" });
            }
        });
        

        // User delete API
        app.delete('/user/:id', verifytoken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            try {
                const result = await userCollection.deleteOne(query);
                if (result.deletedCount > 0) {
                    res.send({ success: true, message: "User deleted" });
                } else {
                    res.status(404).send({ success: false, message: "User not found" });
                }
            } catch (error) {
                console.error("Error deleting user:", error);
                res.status(500).send({ success: false, message: "Internal server error" });
            }
        });

        // User API read
        app.get('/user', async (req, res) => {
            const email = req.query.email;
            // If email is provided, find the specific user by email
            if (email) {
              const user = await userCollection.findOne({ email: email });
              if (user) {
                res.send(user); // Send back the user data
              } else {
                res.status(404).send({ message: 'User not found' }); // Handle case where user is not found
              }
            } else {
              // If no email is provided, return all users
              const cursor = userCollection.find();
              const result = await cursor.toArray();
              res.send(result);
            }
          });

        // Users API create
        app.post('/user', async (req, res) => {
            if (!user.email) {
                return res.status(400).send({ message: 'Invalid user data', insertedId: null });
            }
            try {
                const user = req.body;
                const query = { email: user.email };
                const existingUser = await userCollection.findOne(query);
                if (existingUser) {
                    return res.status(400).send({ message: 'User already exists', insertedId: null });
                }
                const result = await userCollection.insertOne(user);
                res.send(result);
            } catch (error) {
                console.error("Error inserting user:", error);
                res.status(500).send({ message: "Failed to insert user" });
            }
        });

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensure client will close if necessary
    }
}
run().catch(console.dir);

// Sample Route
app.get("/", (req, res) => {
    res.send("Mans Server is running...");
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
