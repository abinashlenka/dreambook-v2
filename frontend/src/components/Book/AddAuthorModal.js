import React, { useState, useEffect } from 'react';
import Button from '@/components/Button';
import { toast } from '@/Utilities/toasters';
import Loader from '@/modules/Loader';
import { addAuthorInBook } from '@/services/APIs/books';

export default function AddAuthorModal({ show, onClose, authors, bookId, fetchBookData }) {
  const [search, setSearch] = useState('');
  const [filteredAuthors, setFilteredAuthors] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Filter authors based on search input
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredAuthors(authors);
    } else {
      const filtered = authors.filter(author =>
        author.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredAuthors(filtered);
    }
  }, [search, authors]);

  const handleAddAuthor = async () => {
    if (!selectedAuthor) return toast('Select an author first', 'error');

    try {
      setAdding(true);
      const payload = { bookId,authorEmail: selectedAuthor };
      const res = await addAuthorInBook(payload);
      if(res){
        fetchBookData()
      }
      if (res.status) {
        toast(`Author ${selectedAuthor} added successfully!`, 'success');
        fetchBookData(bookId); // Refresh book data
        onClose();
      } else {
        toast(res.message || 'Failed to add author', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Error adding author', 'error');
    } finally {
      setAdding(false);
    }
  };

  if (!show) return null;

  return (
    <div className=''>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 relative">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Author</h2>

        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search author..."
          className="w-full p-3 rounded-lg border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Loader */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader />
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredAuthors.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No authors found</p>
            ) : (
              filteredAuthors.map((author, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition 
                  ${selectedAuthor === author ? 'bg-blue-100 border border-blue-400' : 'hover:bg-gray-100'}`}
                  onClick={() => setSelectedAuthor(author)}
                >
                  <span>{author}</span>
                  {selectedAuthor === author && (
                    <span className="text-blue-600 font-bold">✔</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Button */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="secondary"
            className="px-6 py-2 rounded-lg"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="px-6 py-2 rounded-lg flex items-center gap-2"
            onClick={handleAddAuthor}
            disabled={!selectedAuthor || adding}
          >
            {adding ? 'Adding...' : 'Add Author'}
          </Button>
        </div>
      </div>
    </div>
    </div>
  );
}
