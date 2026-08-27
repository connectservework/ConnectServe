const express = require('express');
const {
  getAnalytics,
  getAllUsers,
  updateUserStatus,
  getOrganizations,
  verifyOrganization,
  getModerationQueue,
  resolveReport,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserStatus);
router.get('/organizations', getOrganizations);
router.put('/organizations/:id/verify', verifyOrganization);
router.get('/reports', getModerationQueue);
router.put('/reports/:id', resolveReport);

module.exports = router;
