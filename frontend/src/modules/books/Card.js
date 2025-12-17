import React, { useState } from "react";
import { useRouter } from "next/router";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { Trash2, Eye } from "lucide-react";
import { permissionHandler } from '@/Utilities/permissions';

export default function Card({
  data,
  variant,
  role,
  viewMode = "grid",
  onNavigate,
  handledeleteBook,
}) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

// console.log("data",data)

  /** Navigate to book details */
  const handleView = () => {
    const bookId = data?.id || data?._id;
    if (bookId) {
      if (typeof onNavigate === "function") {
        onNavigate(bookId);
        return;
      }
      router.push(`/books/${bookId}`);
    }
  };

  const handleImageError = () => setImageError(true);
  const handleImageLoad = () => setImageLoaded(true);

  const getImageUrl = () =>
    imageError || !data?.coverImage?.url
      ? "/images/default-book.png"
      : data.coverImage.url;

  const getDiscountPercentage = () => {
    if (data.offer?.price && new Date(data.offer.expiry) > new Date()) {
      return Math.round(((data.price - data.offer.price) / data.price) * 100);
    }
    return 0;
  };

  const getAuthorName = () => {
    if (typeof data.author === "string") return data.author;
    if (data.author?.name) return data.author.name;
    if (data.authorName) return data.authorName;
    return "Unknown Author";
  };

  /** Delete confirm */
 

  return (
    <div
      className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300/50 hover:-translate-y-1 h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Discount Badge */}
      {getDiscountPercentage() > 0 && (
        <div className="absolute top-3 right-12 z-20 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
          -{getDiscountPercentage()}%
        </div>
      )}

      {/* Assigned Badge */}
      {data.assignedBy && (
        <div className="absolute top-3 left-3 z-20 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg">
          Assigned
        </div>
      )}

      {/* Delete Icon (top-right, hover only) */}
       {permissionHandler('deleteBook', role) && (
      <button
        onClick={() => handledeleteBook(data.id)}
        className={`
          absolute top-3 right-3 z-30 p-2 rounded-full bg-red-500 text-white shadow-md
          hover:bg-red-600 transition-all duration-200
          ${isHovered ? "opacity-100" : "opacity-0"}
        `}
      >
        <Trash2 size={16} />
      </button>
       )}

      {/* Image */}
      <div className="relative w-full h-64 overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
        <div
          className={`absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 ${
            !imageLoaded ? "animate-pulse" : ""
          }`}
        />
        <img
          src={getImageUrl()}
          alt={data.title || "Book cover"}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={`
            w-full h-full object-cover transition-all duration-700
            ${imageLoaded ? "opacity-100" : "opacity-0"}
            ${isHovered ? "scale-110" : "scale-100"}
          `}
        />
        {/* Hover overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Quick View */}
        <button
          onClick={handleView}
          className={`
            absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
            font-semibold text-sm flex items-center gap-2
          `}
        >
          <Eye size={16} />
          Quick View
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between p-4 space-y-3">
        <div className="min-h-[72px] flex flex-col justify-between">
          <Badge variant={variant || data?.status} />
          <h2 className="mt-2 text-lg font-bold text-gray-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {data.title}
          </h2>
          <div className="mt-1 text-sm text-gray-600 truncate">
            by <span className="font-medium text-gray-800">{getAuthorName()}</span>
          </div>

          {/* Assigned Info */}
          {data.assignedBy && (
            <div className="mt-2 text-xs text-gray-500">
              <span className="block">
                Assigned by:{" "}
                <span className="font-medium text-gray-700">
                  {data.assignedBy.name || "Unknown"}
                </span>
              </span>
              {data.assignedBy.email && (
                <span className="block">{data.assignedBy.email}</span>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div>
          {data.offer?.price && new Date(data.offer.expiry) > new Date() ? (
            <div>
              <span className="text-xl font-bold text-green-600">
                ₹{data.offer.price}
              </span>
              <span className="ml-2 text-sm text-gray-500 line-through">
                ₹{data.price}
              </span>
              <span className="block text-xs text-green-600 font-medium">
                Save {getDiscountPercentage()}%
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold text-gray-800">₹{data.price}</span>
          )}
        </div>

        {/* View Details */}
        <Button
          variant="primary"
          onClick={handleView}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transform transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl mt-2"
        >
          View Details
        </Button>
      </div>

      
    </div>
  );
}

/** Grid wrapper */
export function CardGrid({
  books,
  viewMode = "grid",
  handledeleteBook,
  onNavigate,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map((book) => (
        <Card
          key={book.id || book._id}
          data={book}
          viewMode={viewMode}
          handledeleteBook={handledeleteBook}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
