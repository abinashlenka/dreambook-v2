const admin = require('firebase-admin');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const config = require("../config/config");
const { getAuth, signInWithCustomToken } = require("firebase/auth");
require("../../firebase-web");

const { authService } = require('../services');

// ✅ Only initialize once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(config.firebase_secret)),
  });
}

const firebaseAuth = (allowUserType = 'All') => async (req, res, next) => {
  const token = req.headers?.authorization?.split(' ')[1];

  if (!token) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please Authenticate!'));
  }

  try {
    const payload = await admin.auth().verifyIdToken(token);
    const user = await authService.getUserByFirebaseUId(payload.uid);

    if (!user) {
      if (['/register', '/register-admin'].includes(req.path) || req.path.includes('secretSignup')) {
        req.newUser = payload;
        req.routeType = allowUserType;
      } else {
        return next(new ApiError(httpStatus.NOT_FOUND, "User doesn't exist. Please create account"));
      }
    } else {
      if (!allowUserType.split(',').includes(user.role) && allowUserType !== 'All') {
        return next(new ApiError(httpStatus.FORBIDDEN, "Sorry, but you can't access this"));
      }

      if (user.isBlocked) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'User is blocked'));
      }
      if (user.isDeleted) {
        return next(new ApiError(httpStatus.GONE, "User doesn't exist anymore"));
      }
      req.user = user;
    }

    return next();
  } catch (err) {
    console.log('FirebaseAuthError:', err);

    if (err.code === 'auth/id-token-expired') {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Session is expired'));
    }

    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Failed to authenticate'));
  }
};

const generateToken = async (req, res, next) => {
  try {
    const token = await admin.auth().createCustomToken(req.params.uid);
    const user = await signInWithCustomToken(getAuth(), token);
    const idToken = user._tokenResponse.idToken;

    return res.status(200).json({
      status: true,
      token: idToken
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      msg: err.message
    });
  }
};

module.exports = { firebaseAuth, generateToken };
