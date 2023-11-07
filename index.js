const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.port || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { JsonWebTokenError } = require("jsonwebtoken");

// middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://bytes-of-thoughts.web.app',
      'https://bytes-of-thoughts.firebaseapp.com'
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// node -> require('crypto').randomBytes(64).toString('hex')

// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.meftkqt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//middlewares
const logger = async (req, res, next) => {
  console.log("Log Info:", req.method, req.url);
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("Token from middleware- ", token);
  // for no token
  if (!token) {
    return res.status(401).send({ message: "Not authorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    // error
    if (error) {
      console.log(error);
      return res.status(401).send({ message: "Unauthorized" });
    }
    //decoded
    console.log("Value in the token- ", decoded);
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const blogCollection = client.db("botsDB").collection("blogs");
    const userCollection = client.db("botsDB").collection("users");
    const commentCollection = client.db("botsDB").collection("comments");
    const wishlistCollection = client.db("botsDB").collection("wishlist");

    //auth
    app.post("/jwt",  async (req, res) => {
      const user = req.body;
      // console.log(user);
      // res.send(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ Success: true });
    });

    app.post('/logout', async(req, res)=>{
      const user = req.body;
      console.log("Log out", user);
      res.clearCookie('token', {maxAge: 0 }).send({ Success: true });
    });

    //service
    app.get("/blogs",  async (req, res) => {
      const cursor = blogCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/blogs", async (req, res) => {
      const blogs = req.body;
      const result = await blogCollection.insertOne(blogs);
      res.send(result);
      //console.log(result);
    });

    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      //console.log(query);
      const result = await blogCollection.findOne(query);
      //console.log(result);
      res.send(result);
    });

    app.put("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
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
          blogOwner: updateBlog.blogOwner,
          blogOwnerProfilePicture: updateBlog.blogOwnerProfilePicture,
        },
      };

      const result = await blogCollection.updateOne(filter, blog, options);
      res.send(result);
      // console.log(result);
    });

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
      //console.log(result);
    });

    // wishlist related apis
    app.get("/wishlist", logger, verifyToken, async (req, res) => {
      // console.log(req.query.email);
      // console.log("token- ", req.cookies.token);
      // console.log("User from valid token", req.user);
      if(req.user.email !== req.query.email){
        return res.status(403).send({ message: "Forbidden Access"});
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const cursor = wishlistCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/wishlist",  async (req, res) => {
      const newItem = req.body;
      console.log(newItem);
      const result = await wishlistCollection.insertOne(newItem);
      res.send(result);
    });

    app.get("/wishlist/:id",  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await wishlistCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    app.delete("/wishlist/:id",  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
      console.log(result);
    });

    // users
    app.get("/users",  async (req, res) => {
      const cursor = userCollection.find();
      const users = await cursor.toArray();
      res.send(users);
    });

    app.post("/users",  async (req, res) => {
      const user = req.body;
      //console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/users",  async (req, res) => {
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
