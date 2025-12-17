const mongoose = require('mongoose');
const { paginate } = require('./plugins/paginate');

const bookSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        title: {
            type: String,
            trim: true,
            required: true,
        },
        subtitle: {
            type: String,
            trim: true,
            default: ""
        },
        coverImage: {
            type: {
                key: String,
                url: String,
            },
            default: null,
        },
        previousAuthors: [   // ✅ store old authors here
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],
        description: {
            type: String,
            default: ""
        },
        isbnNumber: {
            type: String,
            // required: true,
        },
        categories: {
            type: [String],
            default: []
        },
        bindingSize: {
            type: [String],
            enum: ["paperBack", "hardCover", "ebook"],
            default: []
        },
        language: {
            type: String,
            default: "english"
        },
        price: {
            type: Number,
            default: 0
        },
        platforms: {
            type: [
                {
                    platform: {
                        type: String,
                        enum: ["amazon", "flipkart", "dream", "kindle"],
                        required: true
                    },
                    royalty: {
                        type: Number,
                        default: 0
                    }
                }
            ],
            default: []
        },
        status: {
            type: String,
            enum: ["approved", "pending", "rejected"],
            default: "pending"
        },
        isDeleted: { // ✅ soft delete flag
            type: Boolean,
            default: false
        },
        deletedAt: { // optional timestamp
            type: Date
        },
        lastRoyaltyPayDate: { // ✅ track last royalty payment date
            type: Date,
            default: null
        },
        lastRoyaltyPaidForMonth: { // ✅ track which month was last paid
            type: Number,
            default: null
        },
        lastRoyaltyPaidForYear: { // ✅ track which year was last paid
            type: Number,
            default: null
        },
        royaltyPaidUpTo: { // ✅ track royalty paid up to this date
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

bookSchema.plugin(paginate);

const Book = mongoose.model('Book', bookSchema, 'Book');

module.exports = {
    Book
};

platforms: [{ "platform": "amazon", "royality": 50 }]