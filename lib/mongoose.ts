import mongoose from 'mongoose';

//track the connection status
let isConnected = false;
export const connectToDb = async () => {
  //prevent unknown field queries
  mongoose.set('strictQuery', true);

  // figure if there is connection already
  if (!process.env.MONGODB_URI)
    return console.log('MONGODB_URI is not defined');

  if (isConnected) return console.log('=> using existing database connection');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;

    console.log('MongoDB connected!');
  } catch (error) {
    console.log(error);
  }
};
