const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) =>{
    res.send('Bytes of Thoughts Blog server is Running...   ')
})

app.listen(port, () =>{
    console.log(`Bytes of Thoughts server is running on port: ${port}`);
})