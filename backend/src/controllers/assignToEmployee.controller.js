const { Book } = require("../models/book.model");
const { User } = require('../models/user.model');
const { BookAssignment } = require("../models/bookAssign/bookAssignment.model");
const catchAsync = require("../utils/catchAsync");
const logger = require("../config/logger");
const { createAndSendNotification } = require("../services/notifications");


const assignBookToEmployee = catchAsync(async (req, res) => {
    try {
        const { bookId, employeeEmail } = req.body;
        // console.log("bookId, employeeEmail", bookId, employeeEmail);

        if (!bookId || !employeeEmail) {
            return res
                .status(400)
                .json({ status: false, message: "bookId and employeeEmail are required" });
        }

        const adminId = req.user._id;

        // 1. Check if admin
        const adminUser = await User.findById(adminId);
        console.log("adminUser", adminUser);
        if (!adminUser || adminUser.role !== "admin") {
            return res.status(403).json({ status: false, message: "Only admin can assign books" });
        }

        // 2. Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ status: false, message: "Book not found" });
        }

        // 3. Fetch employee by email
        const employee = await User.findOne({ email: employeeEmail });
        if (!employee || employee.role !== "employee") {
            return res
                .status(404)
                .json({ status: false, message: "Employee not found or invalid role" });
        }

        const employeeId = employee._id;

        // 4. Check if book already assigned to ANY employee
        const existingAssignment = await BookAssignment.findOne({ bookId });
        if (existingAssignment) {
            return res
                .status(400)
                .json({ status: false, message: "Book is already assigned to another employee" });
        }

        // 5. Create assignment
        const assignment = await BookAssignment.create({
            bookId,
            employeeId,
            assignedBy: adminId,
        });

         createAndSendNotification({
            userId: employeeId,
            email: employee.email,
            title: "New Book Assigned 📚",
            body: `The book "${book.title}" has been assigned to you by ${adminUser.name}.`,
            data: {
                bookId: book._id.toString(),
                employeeId: employeeId.toString(),
            },
            topic: `user_${employeeId}`, // You can subscribe employee devices to this topic
        });

        return res.status(200).json({
            status: true,
            message: "Book successfully assigned to employee",
            data: assignment,
        });
    } catch (error) {
        logger.error("❌ Error assigning book:", error);
        return res.status(500).json({ status: false, message: "Error assigning book" });
    }
});


const reAssignBookToEmployee = catchAsync(async (req, res) => {
  try {
    const { bookId, employeeEmail } = req.body;

    if (!bookId || !employeeEmail) {
      return res
        .status(400)
        .json({ status: false, message: "bookId and employeeEmail are required" });
    }

    const adminId = req.user._id;

    // 1. Check if admin
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ status: false, message: "Only admin can assign books" });
    }

    // 2. Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ status: false, message: "Book not found" });
    }

    // 3. Fetch new employee by email
    const employee = await User.findOne({ email: employeeEmail });
    if (!employee || employee.role !== "employee") {
      return res
        .status(404)
        .json({ status: false, message: "Employee not found or invalid role" });
    }

    const employeeId = employee._id;

    // 4. Check if book already assigned → notify & remove old employee
    const existingAssignment = await BookAssignment.findOne({ bookId });
    if (existingAssignment) {
      const oldEmployee = await User.findById(existingAssignment.employeeId);

      if (oldEmployee) {
        // Notify old employee
         createAndSendNotification({
          userId: oldEmployee._id,
          email: oldEmployee.email,
          title: "📕 Book Unassigned",
          body: `The book "${book.title}" has been unassigned from you by ${adminUser.name}.`,
          data: {
            bookId: book._id.toString(),
            employeeId: oldEmployee._id.toString(),
          },
          topic: `user_${oldEmployee._id}`,
        });
      }

      // Remove old assignment
      await BookAssignment.deleteOne({ _id: existingAssignment._id });
    }

    // 5. Create new assignment
    const assignment = await BookAssignment.create({
      bookId,
      employeeId,
      assignedBy: adminId,
    });

    // 6. Notify new employee
     createAndSendNotification({
      userId: employeeId,
      email: employee.email,
      title: "📚 Book Assigned",
      body: `The book "${book.title}" has been assigned to you by ${adminUser.name}.`,
      data: {
        bookId: book._id.toString(),
        employeeId: employeeId.toString(),
      },
      topic: `user_${employeeId}`,
    });

    return res.status(200).json({
      status: true,
      message: "Book successfully reassigned to new employee",
      data: assignment,
    });
  } catch (error) {
    logger.error("❌ Error reassigning book:", error);
    return res.status(500).json({ status: false, message: "Error reassigning book" });
  }
});



const getAllEmployeeEmails = catchAsync(async (req, res) => {
    // Fetch all users with role 'employee' and only select email field
    const employees = await User.find({ role: "employee" }).select("email -_id");

    // Map to just an array of emails
    const emails = employees.map(emp => emp.email);

    return res.status(200).json({
        status: true,
        totalEmployees: emails.length,
        data: emails
    });
});

module.exports = { assignBookToEmployee, getAllEmployeeEmails ,reAssignBookToEmployee};