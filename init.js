const mongoose=require('mongoose');
const connectDB = async () => {
    try {
        // Replace <database_name> with your actual database name
        const conn = await mongoose.connect('mongodb://localhost:27017/collegeproject', {
            
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
