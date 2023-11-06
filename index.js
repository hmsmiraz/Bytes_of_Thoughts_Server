const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.meftkqt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const blogCollection = client.db("botsDB").collection("blogs");
    const userCollection = client.db("botsDB").collection("users");
    const commentCollection = client.db("botsDB").collection("comments");

    //service
    app.get("/blogs", async (req, res) => {
      const cursor = blogCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/blogs", async (req, res) => {
      const blogs = req.body;
      const result = await blogCollection.insertOne(blogs);
      res.send(result);
      console.log(result);
    });

    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await blogCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    app.put('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateBlog = req.body;

      const blog = {
          $set: {
            title: updateBlog.title,
            category: updateBlog.category,
            date: updateBlog.date,
            shortDescription: updateBlog.shortDescription,
            longDescription: updateBlog.longDescription,
            picture: updateBlog.picture,
            authorEmail: updateBlog.authorEmail,
          }
      }

      const result = await blogCollection.updateOne(filter, blog, options);
      res.send(result);
      console.log(result)
  })

   //comment
   app.get("/comments", async (req, res) => {
    const cursor = commentCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  });

  app.post("/comments", async (req, res) => {
    const comments = req.body;
    const result = await commentCollection.insertOne(comments);
    res.send(result);
    console.log(result);
  });

    // users
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const users = await cursor.toArray();
      res.send(users);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = {
        $set: {
          uid: user.uid,
          lastLoggedAt: user?.lastLoggedAt,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Bytes of Thoughts Blog server is Running...");
});

app.listen(port, () => {
  console.log(`Bytes of Thoughts server is running on port: ${port}`);
});
