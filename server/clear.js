import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './db.js';
import { User, Task, Request, Customer, Job, Quotation, Invoice, Contract, Report } from './models/schema.js';

dotenv.config();

const clearData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Clearing all data...');

    await User.deleteMany();
    await Task.deleteMany();
    await Request.deleteMany();
    await Customer.deleteMany();
    await Job.deleteMany();
    await Quotation.deleteMany();
    await Invoice.deleteMany();
    await Contract.deleteMany();
    await Report.deleteMany();

    console.log('All sample data successfully cleared from MongoDB!');
    process.exit();
  } catch (error) {
    console.error(`Error clearing data: ${error}`);
    process.exit(1);
  }
};

clearData();
