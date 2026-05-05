import express from 'express';
import { User, Task, Request, Customer, Job, Quotation, Invoice, Contract, Report } from '../models/schema.js';

const router = express.Router();

const models = {
  users: User,
  tasks: Task,
  requests: Request,
  customers: Customer,
  jobs: Job,
  quotations: Quotation,
  invoices: Invoice,
  contracts: Contract,
  reports: Report
};

// Middleware to get the correct model
const getModel = (req, res, next) => {
  const model = models[req.params.collection];
  if (!model) {
    return res.status(404).json({ message: 'Collection not found' });
  }
  req.Model = model;
  next();
};

// GET all
router.get('/:collection', getModel, async (req, res) => {
  try {
    const data = await req.Model.find({});
    // Map _id to id if necessary, but we already have a custom 'id' field
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET by id
router.get('/:collection/:id', getModel, async (req, res) => {
  try {
    const item = await req.Model.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST (Create)
router.post('/:collection', getModel, async (req, res) => {
  try {
    const newItem = new req.Model(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT (Update)
router.put('/:collection/:id', getModel, async (req, res) => {
  try {
    const updatedItem = await req.Model.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ message: 'Not found' });
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE
router.delete('/:collection/:id', getModel, async (req, res) => {
  try {
    const deletedItem = await req.Model.findOneAndDelete({ id: req.params.id });
    if (!deletedItem) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Auth Login Route (Simplified for demo)
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i'), password });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const safeUser = user.toObject();
    delete safeUser.password;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
