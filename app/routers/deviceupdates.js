const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router(); // Not my problem :P
// const db = require('../db/db');
// const utils = require('../utils/utils');

router.get('/', (req, res) => {
  res.json({success: true, message: 'authorized!'});
});

router.get('/:deviceType', (req, res) => {
  if (req.params.deviceType === 'homital-l0') {
    res.json({
      success: true,
      versions: ['v0.0'],
    });
    return;
  } else {
    res.json({
      success: false,
      error: 'device not officially supported, no update available',
    });
  }
});

router.get('/:deviceType/:version', (req, res) => {
  if (req.params.deviceType === 'homital-l0') {
    if (req.params.version === 'v0.0') {
      res.json({
        success: true,
        code: 'print("Err...")\nprint("Did you just update to version 0.0?")',
      });
    } else {
      res.json({
        success: false,
        error: 'requested version does not exist',
      });
    }
    return;
  } else {
    res.json({
      success: false,
      error: 'device not officially supported, no update available',
    });
  }
});

module.exports = router;
