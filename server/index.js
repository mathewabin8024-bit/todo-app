import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = process.env.PORT || 5000;
const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, '../client/dist');
const origins = process.env.CLIENT_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: origins?.length ? origins : true }));
app.use(express.json({ limit: '20kb' }));

const todoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Todo = mongoose.model('Todo', todoSchema);

app.get('/name', (_req, res) => {
  res.type('text/plain').send(`Developer Name: ${process.env.DEVELOPER_NAME || 'Abin'}`);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.get('/api/todos', async (_req, res, next) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

app.post('/api/todos', async (req, res, next) => {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'Please enter a todo.' });
    const todo = await Todo.create({ title });
    res.status(201).json(todo);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/todos/:id', async (req, res, next) => {
  try {
    const updates = {};
    if (typeof req.body.title === 'string') {
      updates.title = req.body.title.trim();
      if (!updates.title) return res.status(400).json({ error: 'Todo text cannot be empty.' });
    }
    if (typeof req.body.completed === 'boolean') updates.completed = req.body.completed;
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Provide a title or completed value.' });
    const todo = await Todo.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!todo) return res.status(404).json({ error: 'Todo not found.' });
    res.json(todo);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/todos/:id', async (req, res, next) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ error: 'Todo not found.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// The backend deployment also serves the built React app at its base URL.
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'), (error) => {
    if (error) res.status(404).send('Todo app is not built yet. Run npm run build.');
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof mongoose.Error.CastError) return res.status(400).json({ error: 'Invalid todo ID.' });
  if (error instanceof mongoose.Error.ValidationError) return res.status(400).json({ error: error.message });
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

async function start() {
  let mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('MONGODB_URI not set. Starting an in-memory MongoDB instance for local development.');
    const memoryServer = await MongoMemoryServer.create();
    mongoUri = memoryServer.getUri();
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  app.listen(port, () => console.log(`Todo app listening on port ${port}`));
}

start().catch((error) => {
  console.error('Could not start the Todo app:', error.message);
  process.exit(1);
});
