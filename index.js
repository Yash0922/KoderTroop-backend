const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('@elastic/elasticsearch');
const redis = require('redis');
const mongoose = require('mongoose');
const fs = require('fs');
const https = require('https');


const app = express();

const esClient = new Client({ node: 'http://localhost:9200'
},
);

const redisClient = redis.createClient();

// Connect to MongoDB
mongoose.connect('mongodb+srv://yashkumarpal987:Yash%4015182204@cluster0.ss532hp.mongodb.net/todo', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define task schema and model
const taskSchema = new mongoose.Schema({
  _id: String,
  title: String,
  description: String
});
const Task = mongoose.model('Task', taskSchema);

app.use(cors());
app.use(express.json());

// Task creation
app.post('/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    const taskId = uuidv4();

    // Store task in MongoDB
    const task = new Task({ _id: taskId, title, description });
    await task.save();

    // Store task in ElasticSearch
    await esClient.indices.create({
      index: 'tasks',
      body: {
        mappings: {
          properties: {
            title: { type: 'text' },
            description: { type: 'text' }
          }
        }
      }
    });

    // Store task in Redis
    redisClient.hmset(taskId, { title, description });

    res.json({ message: 'Task created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Task listing
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({});

    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Task search
app.get('/tasks/search', async (req, res) => {
  try {
    const { query } = req.query;
    await Task.find({ title: query });

    // Search tasks in ElasticSearch
    const { body } = await esClient.search({
      index: 'tasks',
      body: {
        query: {
          match: { title: query }
        }
      }
    });
     

    // res.json({ tasksMongo });

    const tasks = body.hits.hits.map(hit => hit._source);

    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Task deletion
app.delete('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    // Delete task from MongoDB
    await Task.deleteOne({ _id: taskId });

    // Delete task from ElasticSearch
    await esClient.delete({
      index: 'tasks',
      id: taskId
    });

    // Delete task from Redis
    await redisClient.delAsync(taskId);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


app.listen(3000, () => {
  console.log('http://localhost:3000');
});
