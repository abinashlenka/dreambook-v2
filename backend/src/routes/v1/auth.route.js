const express = require('express');

const validate = require('../../middlewares/validate');
const { firebaseAuth, generateToken } = require('../../middlewares/firebaseAuth');
const { authValidation } = require('../../validations');
const { fileUploadService } = require('../../microservices');

const { authController } = require('../../controllers');

const router = express.Router();

// // Example: GET /api/authors?search=Faiq
// router.get('/', authController.getAllAuthors);

router.post('/login',
  firebaseAuth('All'),
  authController.loginUser);

router.post(
  '/register',
  firebaseAuth('User'),
  authController.registerUser
);

// 🔹 Register Admin
router.post(
  '/register-admin',
  (req, res, next) => {
    req.routeType = 'Admin'; // ✅ sets routeType
    next();
  },
  authController.registerUser
);

router.post(
  '/add-author',
  firebaseAuth('admin,employee'),
  authController.addAuthor
);

router.post(
  '/add-employee',
  firebaseAuth('admin'),
  authController.addEmployee
);

router.post("/generate-token/:uid", generateToken);
router.get("/getAuthors",
  firebaseAuth('All'),

  authController.getAuthors);

router.post("/reset-password", authController.resetPassword);


// // At the bottom of your file, after mounting other routes
// const authorRoutes = require('./routes/v1/auth.route'); // Check this path!
// app.use('/api/authors', authorRoutes);


module.exports = router;
