const { authService, favouriteService, userService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const generateReferralCode = require("../utils/generateReferralCode")
const admin = require("firebase-admin");
const { Author, User } = require("../models/user.model");
const { sendPasswordResetLink } = require("../services/notifications")
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const createNewUserObject = newUser => ({
  name: newUser.name,
  email: newUser.email,
  firebaseUid: newUser.uid,
  profilePic: newUser.picture,
  isEmailVerified: newUser.isEmailVerified,
  firebaseSignInProvider: newUser.firebase.sign_in_provider,
  phone: newUser.phone_number,
});

const loginUser = catchAsync(async (req, res) => {
  // Fetch latest user data from DB using user ID or email
  const user = await userService.getUserById(req.user.id); // Adjust as per your userServic
  res.status(200).send({ status: true, message: "Logged in successfully", data: user });
});

const registerUser = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let userRecord;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      // 🟢 Step 1: Try to fetch from Firebase
      userRecord = await admin.auth().getUserByEmail(email);

      // 🟡 Step 2: Check Mongo for duplicate
      const existingAdmin = await User.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({
          status: false,
          message: "Admin with this email already exists",
        });
      }

      // 🟣 Step 3: Create in Mongo (link to existing Firebase UID)
      const adminUser = await User.create({
        firebaseUid: userRecord.uid,
        name,
        email,
        password: hashedPassword,
        firebaseSignInProvider: "email",
        role: "admin",
      });

      // 🔵 Step 4: Send reset link so they can update password
      // await sendPasswordResetLink(email);

      return res.status(200).json({
        status: true,
        message: "Admin restored successfully. Reset link sent.",
        data: adminUser,
      });

    } catch (error) {
      // 🔴 If not found in Firebase, create a new user
      if (error.code === "auth/user-not-found") {
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: name,
          emailVerified: false,
          disabled: false,
        });

        const adminUser = await User.create({
          firebaseUid: userRecord.uid,
          name,
          email,
          password: hashedPassword,
          firebaseSignInProvider: "email",
          role: "admin",
        });

        await sendPasswordResetLink(email);

        return res.status(200).json({
          status: true,
          message: "Admin added successfully. Reset link sent.",
          data: adminUser,
        });
      }

      throw error;
    }

  } catch (err) {
    console.error("❌ Error adding admin:", err);
    res.status(500).json({ status: false, message: err.message });
  }
});

// const registerUser = catchAsync(async (req, res) => {
//   console.log("Registering user with routeType:", req.body);
//   if (req.user) {
//     res.status(401).send({ message: 'User already exist' });
//     // } else if (!req.newUser.email_verified) {
//     //   res.status(401).send({ message: "Email not verified" });
//   } else {
//     const userObj = {
//       ...(req.newUser ? createNewUserObject(req.newUser) : {}),
//       ...req.body,
//     };
//     let user = null;
//     switch (req.routeType) {
//       case 'User':
//         let referralCode = generateReferralCode()
//         user = await authService.createUser({ ...userObj, referralCode });
//         break;
//       case 'Admin':
//         user = await authService.createAdmin({ ...userObj, role: 'admin' });
//         break;
//       default:
//         break;
//     }
//     res.status(201).json({ status: true, message: "User created", data: user });
//   }
// });



const addAuthor = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let userRecord;

    // Hash the password before saving to MongoDB
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      userRecord = await admin.auth().getUserByEmail(email);

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          status: false,
          message: "Author with this email already exists",
        });
      }

      const author = await User.create({
        firebaseUid: userRecord.uid,
        name,
        email,
        password: hashedPassword, // ✅ hashed password
        firebaseSignInProvider: "email",
        role: "author",
      });

      sendPasswordResetLink(email);

      return res.status(200).json({
        status: true,
        message: "Author restored successfully. Reset link sent.",
        data: author,
      });

    } catch (error) {
      if (error.code === "auth/user-not-found") {
        userRecord = await admin.auth().createUser({
          email,
          password, // Firebase password
          displayName: name,
          emailVerified: false,
          disabled: false,
        });

        const author = await User.create({
          firebaseUid: userRecord.uid,
          name,
          email,
          password: hashedPassword, // ✅ hashed password
          firebaseSignInProvider: "email",
          role: "author",
        });

         sendPasswordResetLink(email);

        return res.status(200).json({
          status: true,
          message: "Author added successfully. Password reset link sent.",
          data: author,
        });
      }

      throw error;
    }

  } catch (err) {
    console.error("❌ Error adding author:", err);
    res.status(500).json({ status: false, message: err.message });
  }
});


const addEmployee = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let userRecord;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      userRecord = await admin.auth().getUserByEmail(email);

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          status: false,
          message: "Employee with this email already exists",
        });
      }

      const employee = await User.create({
        firebaseUid: userRecord.uid,
        name,
        email,
        password: hashedPassword,
        firebaseSignInProvider: "email",
        role: "employee",
      });

       sendPasswordResetLink(email);

      return res.status(200).json({
        status: true,
        message: "Employee restored successfully. Reset link sent.",
        data: employee,
      });

    } catch (error) {
      if (error.code === "auth/user-not-found") {
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: name,
          emailVerified: false,
          disabled: false,
        });

        const employee = await User.create({
          firebaseUid: userRecord.uid,
          name,
          email,
          password: hashedPassword,
          firebaseSignInProvider: "email",
          role: "employee",
        });

         sendPasswordResetLink(email);

        return res.status(200).json({
          status: true,
          message: "Employee added successfully. Reset link sent.",
          data: employee,
        });
      }

      throw error;
    }

  } catch (err) {
    console.error("❌ Error adding employee:", err);
    res.status(500).json({ status: false, message: err.message });
  }
});







const getAuthors = catchAsync(async (req, res) => {
  const authors = await User.find({ role: "author", isDeleted: false })
    .select("email -_id"); // ✅ only email, remove _id

  if (!authors.length) {
    return res.status(404).json({
      status: false,
      message: "No authors found",
    });
  }

  // convert to plain array of emails
  const emails = authors.map(author => author.email);

  res.status(200).json({
    status: true,
    message: "Authors emails fetched successfully",
    data: emails,
  });
});


const resetPassword = catchAsync(async (req, res) => {
  const { oobCode, newPassword } = req.body;

  if (!oobCode || !newPassword) {
    return res.status(400).json({
      status: false,
      message: "oobCode and newPassword are required",
    });
  }

  try {
    // 1️⃣ Verify the reset code is valid
    const email = await admin.auth().verifyPasswordResetCode(oobCode);

    // 2️⃣ Update password in Firebase
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, { password: newPassword });

    // 3️⃣ Hash password for Mongo
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 4️⃣ Update password in MongoDB
    await User.findOneAndUpdate(
      { firebaseUid: userRecord.uid },
      { password: hashedPassword }
    );

    // 5️⃣ Confirm reset
    await admin.auth().confirmPasswordReset(oobCode, newPassword);

    return res.status(200).json({
      status: true,
      message: "Password has been reset successfully in Firebase and MongoDB",
    });
  } catch (err) {
    console.error("❌ Error resetting password:", err);
    return res.status(400).json({
      status: false,
      message: "Invalid or expired reset code",
    });
  }
});




// NEW: Function to fetch all authors with search filtering.
const getAllAuthors = catchAsync(async (req, res) => {
  // Optionally, set up any population configuration if needed.
  const populateConfig = [];
  // Call the service function to fetch authors based on req.query.
  const authors = await authorService.getAllAuthors(req.query, populateConfig);
  res.status(200).json({
    status: true,
    message: "All authors retrieved successfully",
    data: authors,
  });
});

module.exports = {
  loginUser,
  registerUser,
  addAuthor,
  addEmployee,
  getAllAuthors,
  getAuthors,
  resetPassword
};
