const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');
const { Book } = require('../models/book.model');
const { User } = require('../models/user.model');
const { bookService } = require('../services');
const { fileUploadService } = require('../microservices');
const { BookAssignment } = require('../models/bookAssign/bookAssignment.model'); 
const catchAsync = require("../utils/catchAsync");
const { createAndSendNotification } = require('../services/notifications');
const slugify = require('slugify'); // ✅ Added slugify import

const searchQuery = (search, field) => {
  return [{ [field]: { $regex: search, $options: 'i' } }];
};

// ✅ Updated addBook with Slugify fix
const addBook = catchAsync(async (req, res) => {
  if (req.body.platforms) {
    req.body.platforms = JSON.parse(req.body.platforms);
  }

  if (req.user && req.user.role === "author") {
    req.body.status = "pending";
  }

  if (req.file) {
    try {
        const uploadResult = await fileUploadService.s3Upload([req.file], 'coverImages');
        const coverImage = uploadResult[0]; 

        // ✅ FIX: Generate unique normalizedTitle (slug)
        const normalizedTitle = req.body.title 
            ? slugify(req.body.title, { lower: true, strict: true }) 
            : `book-${Date.now()}`;

        let book = await bookService.addBook({ 
            ...req.body, 
            normalizedTitle, // ✅ Pass the generated slug here
            coverImage, 
            source: req.body.source || "manual" 
        });

        // ✅ AUTO-ASSIGN LOGIC
        if (req.user && req.user.role === "employee") {
            await BookAssignment.create({
                bookId: book._id,
                employeeId: new mongoose.Types.ObjectId(req.user._id), // Strict ObjectId
                assignedBy: new mongoose.Types.ObjectId(req.user._id), // Strict ObjectId
                status: "pending",
                assignedAt: new Date()
            });
        }

        const message = req.body.status === "pending" 
            ? "Book submitted successfully for review." 
            : "Book added successfully.";

        return res.status(200).send({ status: true, message: message, data: book });

    } catch (error) {
        console.error("Upload Error:", error); 
        // ✅ Handle Duplicate Error Gracefully
        if (error.code === 11000) {
            return res.status(400).json({ status: false, message: "A book with this title already exists." });
        }
        return res.status(500).json({ status: false, message: "Upload Failed: " + error.message });
    }
  } else {
    return res.status(400).json({ status: false, message: "Please pass cover image" });
  }
});

const getAllBooks = catchAsync(async (req, res) => {
  const user = req.user || {};
  const populateConfig = [{ path: "author", select: "_id name email" }];
  let { page = 1, limit = 10, keyword, search, status, sort } = req.query;
  let filters = {};

  if (status && status.trim() !== "" && status !== "All") filters.status = status.trim();
  if (user.role === "author") filters.author = user._id;

  let assignedOnly = true;
  if (keyword === "unassigned") assignedOnly = false;
  else if (keyword === "assigned") assignedOnly = true;

  const searchTerm = (search || "").trim().toLowerCase();
  if (searchTerm && searchTerm !== "") {
    assignedOnly = null; 
    const qStringTitle = searchQuery(searchTerm, "title");
    const qStringSubTitle = searchQuery(searchTerm, "subtitle");
    const qStringIsbnNumber = searchQuery(searchTerm, "isbnNumber");
    const qStringDescription = searchQuery(searchTerm, "description");
    const qStringCategories = searchQuery(searchTerm, "categories");
    const qStringLanguage = searchQuery(searchTerm, "language");

    filters.$or = [].concat(qStringTitle, qStringSubTitle, qStringIsbnNumber, qStringDescription, qStringCategories, qStringLanguage);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: sort === "oldToNew" ? "createdAt" : "-createdAt",
  };

  const result = await bookService.fetchBooks(filters, populateConfig, options, assignedOnly);

  res.status(200).json({
    status: true,
    message: "Books fetched successfully",
    data: result.results.map(formatBookResponse),
    pagination: result.pagination,
  });
});

function formatBookResponse(book) {
  return {
    id: book._id,
    title: book.title,
    author: book.author,
    isbnNumber: book.isbnNumber,
    categories: book.categories,
    coverImage: book.coverImage,
    bindingSize: book.bindingSize,
    language: book.language,
    price: book.price,
    platforms: book.platforms,
    status: book.status,
    description: book.description,
  };
}

const addAuthorInBook = catchAsync(async (req, res) => {
  const { bookId, authorEmail } = req.body;
  if (!bookId || !authorEmail) return res.status(400).json({ status: false, message: "Missing fields" });

  const author = await User.findOne({ email: authorEmail.toLowerCase(), isDeleted: false });
  if (!author) return res.status(404).json({ status: false, message: "Author not found" });

  const book = await Book.findById(bookId).populate("author", "name email role");
  if (!book) return res.status(404).json({ status: false, message: "Book not found" });

  const oldAuthor = book.author ? book.author._id : null;
  if (oldAuthor && oldAuthor.toString() !== author._id.toString()) {
    if (!book.previousAuthors) book.previousAuthors = [];
    if (!book.previousAuthors.includes(oldAuthor)) book.previousAuthors.push(oldAuthor);
  }

  book.author = author._id;
  await book.save();
  await book.populate("author", "name email role");

  res.status(200).json({ status: true, message: "Author assigned", data: book });
});

const getBookById = catchAsync(async (req, res) => {
  const book = await bookService.getBookById(req.params.id);
  if (!book) return res.status(400).json({ status: false, message: "Book not found" });

  let assignedEmployees = [];

  // ✅ VISIBILITY: Allow Admin AND Employee to see assignments
  if (req.user && (req.user.role === "admin" || req.user.role === "employee")) {
    const assignments = await BookAssignment.find({ bookId: req.params.id })
      .populate("employeeId", "name email")
      .populate("assignedBy", " email name");

    assignedEmployees = assignments.map(a => ({
      _id: a.employeeId._id,
      name: a.employeeId.name,
      email: a.employeeId.email,
      assignedByName: a.assignedBy?.name,
      assignedByEmail: a.assignedBy?.email
    }));
  }

  return res.status(200).json({
    status: true,
    message: "Book details",
    data: {
      id: book._id,
      title: book.title,
      author: book.author,
      subtitle: book.subtitle,
      isbnNumber: book.isbnNumber,
      categories: book.categories,
      coverImage: book.coverImage,
      bindingSize: book.bindingSize,
      language: book.language,
      price: book.price,
      platforms: book.platforms,
      source: book.source,
      status: book.status,
      description: book.description,
      assignedEmployees, 
    }
  });
});

const updateBookById = catchAsync(async (req, res) => {
  const { isbnNumber } = req.body;
  if (!isbnNumber || isbnNumber.trim() === "") return res.status(400).json({ status: false, message: "ISBN required" });

  const book = await bookService.getBookById(req.params.id);
  if (!book) return res.status(404).json({ status: false, message: "Book not found" });

  if (req.file) {
    const [coverImage] = await fileUploadService.s3Upload([req.file], "coverImages").catch(() => {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload cover image");
    });
    req.body.coverImage = coverImage;
  }

  if (req.body.platforms) {
    try { req.body.platforms = JSON.parse(req.body.platforms); } 
    catch { return res.status(400).json({ status: false, message: "Invalid platforms JSON" }); }
  }

  Object.keys(req.body).forEach((key) => {
    if (req.body[key] === "" || req.body[key] === null) delete req.body[key];
  });

  const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true, lean: true });
  return res.status(200).json({ status: true, message: "Book updated successfully", data: updatedBook });
});

const deleteBookById = catchAsync(async (req, res) => {
  const bookId = req.params.id;
  const book = await Book.findById(bookId);
  if (!book) return res.status(400).json({ status: false, message: "Book not found" });

  await BookAssignment.deleteMany({ bookId });
  await Book.findByIdAndDelete(bookId);

  return res.status(200).json({ status: true, message: "Book deleted", data: book });
});

const getAssignedBooks = catchAsync(async (req, res) => {
  const { id } = req.params;
  let { page = 1, limit = 10, keyword, search, status, sort } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  // ✅ Strict ObjectId for filters
  const filters = { employeeId: new mongoose.Types.ObjectId(id) };

  if (status && status.trim() !== "" && status !== "all") filters.status = status.trim().toLowerCase();

  const searchTerm = search || (keyword && keyword !== "assigned" ? keyword : "");
  if (searchTerm && searchTerm.trim() !== "") {
    const regex = new RegExp(searchTerm.trim(), "i");
    const matchingBooks = await Book.find({
      $or: [{ title: regex }, { subtitle: regex }, { isbnNumber: regex }, { description: regex }, { categories: regex }, { language: regex }]
    }).select('_id');

    filters.bookId = { $in: matchingBooks.map(b => b._id) };
  }

  let sortOption = { assignedAt: -1 };
  if (sort === "oldToNew") sortOption = { assignedAt: 1 };
  else if (sort === "newToOld") sortOption = { assignedAt: -1 };

  const skip = (page - 1) * limit;
  const total = await BookAssignment.countDocuments(filters);
  const assignments = await BookAssignment.find(filters)
    .populate("bookId")
    .populate("assignedBy", "name email")
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const data = await Promise.all(assignments.map(async (assignment) => {
      const book = assignment.bookId;
      let author = null;
      if (book?.author) author = await User.findById(book.author).select("name _id");

      return {
        assignmentId: assignment._id,
        assignedAt: assignment.assignedAt,
        status: assignment.status,
        assignedBy: assignment.assignedBy ? { name: assignment.assignedBy.name, email: assignment.assignedBy.email, _id: assignment.assignedBy._id } : null,
        book: {
          id: book?._id || null,
          title: book?.title || null,
          author: author?.name || null,
          authorId: author?._id || null,
          isbnNumber: book?.isbnNumber || null,
          categories: book?.categories || [],
          coverImage: book?.coverImage || null,
          bindingSize: book?.bindingSize || [],
          language: book?.language || null,
          price: book?.price || null,
          platforms: book?.platforms || [],
          source: book?.source || null,
          description: book?.description || null,
        },
      };
    }));

  return res.status(200).json({ status: true, message: "Assigned books fetched", data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

const approvedByorRejectedBy = catchAsync(async (req, res) => {
  const { id: bookId } = req.params;
  const { status, userId } = req.body;

  if (!["approved", "rejected", "pending"].includes(status)) return res.status(400).json({ status: false, message: "Invalid status" });

  const book = await Book.findByIdAndUpdate(bookId, { status }, { new: true, runValidators: false });
  if (!book) return res.status(404).json({ status: false, message: "Book not found" });

  const updatedAssignment = await BookAssignment.findOneAndUpdate(
    { bookId },
    { status, approvedByorRejectedBy: userId },
    { new: true }
  ).populate("employeeId", "name email").populate("assignedBy", "name email");

  if (updatedAssignment?.assignedBy) {
    const { assignedBy, employeeId } = updatedAssignment;
     createAndSendNotification({
      userId: assignedBy._id,
      email: assignedBy.email,
      title: `Book assignment was ${status}`,
      body: `The book "${book.title}" assigned to ${employeeId?.name || "an employee"} has been ${status}`,
      data: { bookId: String(book._id), assignmentId: String(updatedAssignment._id), status: String(status) },
      topic: `user_${assignedBy._id}`,
    });
  }

  return res.status(200).json({ status: true, message: `Book ${status} successfully`, data: { book, assignment: updatedAssignment || null } });
});

module.exports = { addBook, getAllBooks, getBookById, updateBookById, deleteBookById, addAuthorInBook, approvedByorRejectedBy, getAssignedBooks };








// const httpStatus = require('http-status');
// const ApiError = require('../utils/ApiError');
// const mongoose = require('mongoose');
// const { Book } = require('../models/book.model');
// const { User } = require('../models/user.model');
// const { bookService } = require('../services');
// const { fileUploadService } = require('../microservices');
// const { BookAssignment } = require('../models/bookAssign/bookAssignment.model'); 
// const catchAsync = require("../utils/catchAsync");
// const { createAndSendNotification } = require('../services/notifications');

// const searchQuery = (search, field) => {
//   return [{ [field]: { $regex: search, $options: 'i' } }];
// };

// // ✅ Updated addBook: Strictly assigns ID
// const addBook = catchAsync(async (req, res) => {
//   if (req.body.platforms) {
//     req.body.platforms = JSON.parse(req.body.platforms);
//   }

//   if (req.user && req.user.role === "author") {
//     req.body.status = "pending";
//   }

//   if (req.file) {
//     try {
//         const uploadResult = await fileUploadService.s3Upload([req.file], 'coverImages');
//         const coverImage = uploadResult[0]; 

//         let book = await bookService.addBook({ 
//             ...req.body, 
//             coverImage, 
//             source: req.body.source || "manual" 
//         });

//         // ✅ AUTO-ASSIGN LOGIC
//         if (req.user && req.user.role === "employee") {
//             await BookAssignment.create({
//                 bookId: book._id,
//                 employeeId: new mongoose.Types.ObjectId(req.user._id), // Strict ObjectId
//                 assignedBy: new mongoose.Types.ObjectId(req.user._id), // Strict ObjectId
//                 status: "pending",
//                 assignedAt: new Date()
//             });
//         }

//         const message = req.body.status === "pending" 
//             ? "Book submitted successfully for review." 
//             : "Book added successfully.";

//         return res.status(200).send({ status: true, message: message, data: book });

//     } catch (error) {
//         console.error("Upload Error:", error); 
//         return res.status(500).json({ status: false, message: "Upload Failed: " + error.message });
//     }
//   } else {
//     return res.status(400).json({ status: false, message: "Please pass cover image" });
//   }
// });

// const getAllBooks = catchAsync(async (req, res) => {
//   const user = req.user || {};
//   const populateConfig = [{ path: "author", select: "_id name email" }];
//   let { page = 1, limit = 10, keyword, search, status, sort } = req.query;
//   let filters = {};

//   if (status && status.trim() !== "" && status !== "All") filters.status = status.trim();
//   if (user.role === "author") filters.author = user._id;

//   let assignedOnly = true;
//   if (keyword === "unassigned") assignedOnly = false;
//   else if (keyword === "assigned") assignedOnly = true;

//   const searchTerm = (search || "").trim().toLowerCase();
//   if (searchTerm && searchTerm !== "") {
//     assignedOnly = null; 
//     const qStringTitle = searchQuery(searchTerm, "title");
//     const qStringSubTitle = searchQuery(searchTerm, "subtitle");
//     const qStringIsbnNumber = searchQuery(searchTerm, "isbnNumber");
//     const qStringDescription = searchQuery(searchTerm, "description");
//     const qStringCategories = searchQuery(searchTerm, "categories");
//     const qStringLanguage = searchQuery(searchTerm, "language");

//     filters.$or = [].concat(qStringTitle, qStringSubTitle, qStringIsbnNumber, qStringDescription, qStringCategories, qStringLanguage);
//   }

//   const options = {
//     page: parseInt(page),
//     limit: parseInt(limit),
//     sort: sort === "oldToNew" ? "createdAt" : "-createdAt",
//   };

//   const result = await bookService.fetchBooks(filters, populateConfig, options, assignedOnly);

//   res.status(200).json({
//     status: true,
//     message: "Books fetched successfully",
//     data: result.results.map(formatBookResponse),
//     pagination: result.pagination,
//   });
// });

// function formatBookResponse(book) {
//   return {
//     id: book._id,
//     title: book.title,
//     author: book.author,
//     isbnNumber: book.isbnNumber,
//     categories: book.categories,
//     coverImage: book.coverImage,
//     bindingSize: book.bindingSize,
//     language: book.language,
//     price: book.price,
//     platforms: book.platforms,
//     status: book.status,
//     description: book.description,
//   };
// }

// const addAuthorInBook = catchAsync(async (req, res) => {
//   const { bookId, authorEmail } = req.body;
//   if (!bookId || !authorEmail) return res.status(400).json({ status: false, message: "Missing fields" });

//   const author = await User.findOne({ email: authorEmail.toLowerCase(), isDeleted: false });
//   if (!author) return res.status(404).json({ status: false, message: "Author not found" });

//   const book = await Book.findById(bookId).populate("author", "name email role");
//   if (!book) return res.status(404).json({ status: false, message: "Book not found" });

//   const oldAuthor = book.author ? book.author._id : null;
//   if (oldAuthor && oldAuthor.toString() !== author._id.toString()) {
//     if (!book.previousAuthors) book.previousAuthors = [];
//     if (!book.previousAuthors.includes(oldAuthor)) book.previousAuthors.push(oldAuthor);
//   }

//   book.author = author._id;
//   await book.save();
//   await book.populate("author", "name email role");

//   res.status(200).json({ status: true, message: "Author assigned", data: book });
// });

// const getBookById = catchAsync(async (req, res) => {
//   const book = await bookService.getBookById(req.params.id);
//   if (!book) return res.status(400).json({ status: false, message: "Book not found" });

//   let assignedEmployees = [];

//   // ✅ VISIBILITY: Allow Admin AND Employee to see assignments
//   if (req.user && (req.user.role === "admin" || req.user.role === "employee")) {
//     const assignments = await BookAssignment.find({ bookId: req.params.id })
//       .populate("employeeId", "name email")
//       .populate("assignedBy", " email name");

//     assignedEmployees = assignments.map(a => ({
//       _id: a.employeeId._id,
//       name: a.employeeId.name,
//       email: a.employeeId.email,
//       assignedByName: a.assignedBy?.name,
//       assignedByEmail: a.assignedBy?.email
//     }));
//   }

//   return res.status(200).json({
//     status: true,
//     message: "Book details",
//     data: {
//       id: book._id,
//       title: book.title,
//       author: book.author,
//       subtitle: book.subtitle,
//       isbnNumber: book.isbnNumber,
//       categories: book.categories,
//       coverImage: book.coverImage,
//       bindingSize: book.bindingSize,
//       language: book.language,
//       price: book.price,
//       platforms: book.platforms,
//       source: book.source,
//       status: book.status,
//       description: book.description,
//       assignedEmployees, 
//     }
//   });
// });

// const updateBookById = catchAsync(async (req, res) => {
//   const { isbnNumber } = req.body;
//   if (!isbnNumber || isbnNumber.trim() === "") return res.status(400).json({ status: false, message: "ISBN required" });

//   const book = await bookService.getBookById(req.params.id);
//   if (!book) return res.status(404).json({ status: false, message: "Book not found" });

//   if (req.file) {
//     const [coverImage] = await fileUploadService.s3Upload([req.file], "coverImages").catch(() => {
//         throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload cover image");
//     });
//     req.body.coverImage = coverImage;
//   }

//   if (req.body.platforms) {
//     try { req.body.platforms = JSON.parse(req.body.platforms); } 
//     catch { return res.status(400).json({ status: false, message: "Invalid platforms JSON" }); }
//   }

//   Object.keys(req.body).forEach((key) => {
//     if (req.body[key] === "" || req.body[key] === null) delete req.body[key];
//   });

//   const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true, lean: true });
//   return res.status(200).json({ status: true, message: "Book updated successfully", data: updatedBook });
// });

// const deleteBookById = catchAsync(async (req, res) => {
//   const bookId = req.params.id;
//   const book = await Book.findById(bookId);
//   if (!book) return res.status(400).json({ status: false, message: "Book not found" });

//   await BookAssignment.deleteMany({ bookId });
//   await Book.findByIdAndDelete(bookId);

//   return res.status(200).json({ status: true, message: "Book deleted", data: book });
// });

// const getAssignedBooks = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   let { page = 1, limit = 10, keyword, search, status, sort } = req.query;
//   page = parseInt(page);
//   limit = parseInt(limit);

//   // ✅ Strict ObjectId for filters
//   const filters = { employeeId: new mongoose.Types.ObjectId(id) };

//   if (status && status.trim() !== "" && status !== "all") filters.status = status.trim().toLowerCase();

//   const searchTerm = search || (keyword && keyword !== "assigned" ? keyword : "");
//   if (searchTerm && searchTerm.trim() !== "") {
//     const regex = new RegExp(searchTerm.trim(), "i");
//     const matchingBooks = await Book.find({
//       $or: [{ title: regex }, { subtitle: regex }, { isbnNumber: regex }, { description: regex }, { categories: regex }, { language: regex }]
//     }).select('_id');

//     filters.bookId = { $in: matchingBooks.map(b => b._id) };
//   }

//   let sortOption = { assignedAt: -1 };
//   if (sort === "oldToNew") sortOption = { assignedAt: 1 };
//   else if (sort === "newToOld") sortOption = { assignedAt: -1 };

//   const skip = (page - 1) * limit;
//   const total = await BookAssignment.countDocuments(filters);
//   const assignments = await BookAssignment.find(filters)
//     .populate("bookId")
//     .populate("assignedBy", "name email")
//     .sort(sortOption)
//     .skip(skip)
//     .limit(limit);

//   const data = await Promise.all(assignments.map(async (assignment) => {
//       const book = assignment.bookId;
//       let author = null;
//       if (book?.author) author = await User.findById(book.author).select("name _id");

//       return {
//         assignmentId: assignment._id,
//         assignedAt: assignment.assignedAt,
//         status: assignment.status,
//         assignedBy: assignment.assignedBy ? { name: assignment.assignedBy.name, email: assignment.assignedBy.email, _id: assignment.assignedBy._id } : null,
//         book: {
//           id: book?._id || null,
//           title: book?.title || null,
//           author: author?.name || null,
//           authorId: author?._id || null,
//           isbnNumber: book?.isbnNumber || null,
//           categories: book?.categories || [],
//           coverImage: book?.coverImage || null,
//           bindingSize: book?.bindingSize || [],
//           language: book?.language || null,
//           price: book?.price || null,
//           platforms: book?.platforms || [],
//           source: book?.source || null,
//           description: book?.description || null,
//         },
//       };
//     }));

//   return res.status(200).json({ status: true, message: "Assigned books fetched", data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
// });

// const approvedByorRejectedBy = catchAsync(async (req, res) => {
//   const { id: bookId } = req.params;
//   const { status, userId } = req.body;

//   if (!["approved", "rejected", "pending"].includes(status)) return res.status(400).json({ status: false, message: "Invalid status" });

//   const book = await Book.findByIdAndUpdate(bookId, { status }, { new: true, runValidators: false });
//   if (!book) return res.status(404).json({ status: false, message: "Book not found" });

//   const updatedAssignment = await BookAssignment.findOneAndUpdate(
//     { bookId },
//     { status, approvedByorRejectedBy: userId },
//     { new: true }
//   ).populate("employeeId", "name email").populate("assignedBy", "name email");

//   if (updatedAssignment?.assignedBy) {
//     const { assignedBy, employeeId } = updatedAssignment;
//      createAndSendNotification({
//       userId: assignedBy._id,
//       email: assignedBy.email,
//       title: `Book assignment was ${status}`,
//       body: `The book "${book.title}" assigned to ${employeeId?.name || "an employee"} has been ${status}`,
//       data: { bookId: String(book._id), assignmentId: String(updatedAssignment._id), status: String(status) },
//       topic: `user_${assignedBy._id}`,
//     });
//   }

//   return res.status(200).json({ status: true, message: `Book ${status} successfully`, data: { book, assignment: updatedAssignment || null } });
// });

// module.exports = { addBook, getAllBooks, getBookById, updateBookById, deleteBookById, addAuthorInBook, approvedByorRejectedBy, getAssignedBooks };