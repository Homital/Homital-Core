const express = require('express');
const router = express.Router();
const db = require('../db/db');
const utils = require('../utils/utils');

router.get('/', utils.authenticateToken , (req, res) => {
    res.json({success: true});
});

module.exports = router;