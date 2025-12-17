const express = require("express");
const router = express.Router();
const { assignBookToEmployee,getAllEmployeeEmails,reAssignBookToEmployee } = require("../../controllers/assignToEmployee.controller");
const {firebaseAuth} = require("../../middlewares/firebaseAuth");

// POST /api/dashboard/assign-book
router.post("/assign-book", firebaseAuth("All"), assignBookToEmployee);
router.post("/re-assign-book", firebaseAuth("All"), reAssignBookToEmployee);
// GET /api/dashboard/employee-emails
router.get("/employee-emails", firebaseAuth("All"), getAllEmployeeEmails);

module.exports = router;
