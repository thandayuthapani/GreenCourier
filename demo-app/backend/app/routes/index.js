const express = require('express');
const router = express.Router();

router.use('/users', require('./users'))
router.use('/predictions', require('./predictions'));
router.use('/consumers', require('./consumers'));
router.use('*', (req,res) => {
  // Prevent returning frontend elements unter /api endpoint
  res.sendStatus(404);
});

module.exports = router;
