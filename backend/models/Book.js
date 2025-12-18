const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  googleBooksId: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: true
  },
  authors: [String],
  description: String,
  coverImage: String,
  publishedDate: String,
  pageCount: Number,
  categories: [String],
  isbn: String,
  averageRating: {
    type: Number,
    default: 0
  },
  ratingsCount: {
    type: Number,
    default: 0
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Book', bookSchema);
