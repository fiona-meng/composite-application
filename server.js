require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const compositeService = require('./services/compositeService');

app.use(express.json());
app.use(cors());

// Add root route handler
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Composite API' });
});

// Define specific base routes for each service
app.use('/composite', compositeService);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});