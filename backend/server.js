const app = require('./app');
const dotenv = require('dotenv');
const connectDatabase = require("./config/database")

//Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log(`ERROR: ${err.message}`);
    console.log('Shutting down the server due to uncaught exception');
    process.exit(1)
})

//config
dotenv.config({ path: 'backend/config/config.env' });

//connection to database
connectDatabase();


const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
});

//Handle unhandled promise rejections
process.on('unhandledRejection', err => {
    console.log(`ERROR: ${err.message}`);
    console.log('Shutting down the server due to unhandled promise rejection');
    server.close(() => {
        process.exit(1)
    })
})

