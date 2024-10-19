require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const compositeService = require('./services/compositeService');

app.use(express.json());
app.use(cors());

// Define specific base routes for each service
app.use('/composite', compositeService);

app.listen(process.env.PORT, () => {
    console.log(`Composite server started on port ${process.env.PORT}`);
});