const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('@elastic/elasticsearch');
// const redis = require('redis');
const mongoose = require('mongoose');
const fs = require('fs');
const https = require('https');


const app = express();

const esClient = new Client({ node: 'https://localhost:9200',
auth: {
  username: 'elastic',
  password: 'GoiKGG8r+e+XeUY*4v3I',
},
tls:{
  ca: fs.readFileSync('./http_ca.crt', 'utf8'),
        rejectUnauthorized: true
}
},
);

// const redisClient = redis.createClient({ host: '127.0.0.1',
// port: 6379,
// });


// redisClient.on('connect', () => {
//   console.log('Redis client connected');
// });

// redisClient.on('error', (error) => {
//   console.error('Redis error:', error);
// });

// Connect to MongoDB
mongoose.connect('mongodb+srv://yashkumarpal987:Yash%4015182204@cluster0.ss532hp.mongodb.net/todo', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define task schema and model
const taskSchema = new mongoose.Schema({
  _id: String,
  name: String,
  complete:Boolean,

});
const Task = mongoose.model('Task', taskSchema);

app.use(cors());
app.use(express.json());

// Task creation
app.post('/tasks', async (req, res) => {
  try {
    const { name} = req.body;
    const taskId = uuidv4();

    // Store task in MongoDB
    const task = new Task({ _id: taskId, name, complete:false  });
    await task.save();

    // Store task in ElasticSearch
    // await esClient.indices.create({
    //   index: 'tasks',
    //   body: {
    //     mappings: {
    //       properties: {
    //         name: { type: 'text' },
            
    //       }
    //     }
    //   }
    // });
    // let result  = await esClient.index({
    //   index: 'tasks',
    //   body: {
    //     name
    //   }
    // })
// console.log(result);
    // Store task in Redis
    // redisClient.hSet(taskId, 'name', name, (error, reply) => {
    //   if (error) {
    //     console.error('Error storing task in Redis:', error);
    //     return;
    //   }
    //   console.log('Task stored in Redis:', reply);
    // });

    res.json({ message: 'Task created successfully',result: task});
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
    console.log(query);
   let result = await Task.find({ name: query });

    // Search tasks in ElasticSearch
    // const result = await esClient.search({
    //   index: 'tasks',
    //   body: {
    //     query: {
    //       match: { name: query }
    //     }
    //   }
    // });
     

    // res.json({ tasksMongo });
console.log(result)

    // const tasks = body.hits.hits.map(hit => hit._source);

    // res.json({ result: result.hits.hits});
    res.json({ result: result});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});
app.patch('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the task in MongoDB
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Toggle the completion status
    task.complete = !task.complete;
    await task.save();

    res.json({ message: 'Task completion status toggled successfully', result: task });
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
    let result  = await Task.deleteOne({ _id: taskId });

    // Delete task from ElasticSearch
    

    // Delete task from Redis
    // await redisClient.delAsync(taskId);

    res.json({ message: 'Task deleted successfully',result:result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


app.listen(3001, () => {
  console.log('http://localhost:3001');
});
