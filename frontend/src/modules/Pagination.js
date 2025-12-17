import React, { useEffect, useState } from "react";

export default function Pagination(props) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [show, setShow] = useState(false);

  const limitHandler = (limit) => {
    setPageSize(limit);
    setShow(false);
    props.handler(
      props.filters.keyword,
      props.filters.status,
      1, // Reset to page 1 when changing limit
      limit,
      props.filters.sort
    );
  };

  // for decrease page number
  const pageNumberDecrement = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      props.handler(
        props.filters.keyword,
        props.filters.status,
        newPage,
        pageSize,
        props.filters.sort
      );
    }
  };

  const pageNumberIncrement = () => {
    const totalPages = props.data?.totalPages || 1;
    if (pageNumber < totalPages) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      props.handler(
        props.filters.keyword,
        props.filters.status,
        newPage,
        pageSize,
        props.filters.sort
      );
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= (props.data?.totalPages || 1)) {
      setPageNumber(page);
      props.handler(
        props.filters.keyword,
        props.filters.status,
        page,
        pageSize,
        props.filters.sort
      );
    }
  };

  useEffect(() => {
    setPageNumber(props.filters.page || 1);
    setPageSize(props.filters.limit || 10);
  }, [props.filters]);

  const currentPage = props.filters.page || 1;
  const totalPages = props.data?.totalPages || 1;
  const itemsPerPage = props.filters.limit || 10;
  const totalItems = props.data?.total || 0;

  // Generate page numbers for display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="w-full rounded-b-md flex flex-wrap items-center justify-between px-5 pb-3 pt-3 border-t bg-white border-[#E9E9EC]">
      <div className="flex items-center gap-5">
        <h5 className="text-sm font-normal text-[#71737F]">
          Showing {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          to {Math.min(currentPage * itemsPerPage, totalItems)}
          of {totalItems} entries
        </h5>
        <div
          onClick={(e) => setShow(!show)}
          className="px-3 py-2 border border-[#dcdbe1] cursor-pointer rounded-md flex items-center gap-5 relative"
        >
          <h5 className="text-sm font-semibold text-[#000]">{pageSize}</h5>
          <span className="flex justify-end">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M9.99999 14.6874C9.75145 14.6863 9.51317 14.5882 9.33593 14.414L3.08593 8.16398C2.90981 7.98786 2.81087 7.74899 2.81087 7.49992C2.81087 7.25085 2.90981 7.01197 3.08593 6.83585C3.26205 6.65973 3.50092 6.56079 3.74999 6.56079C3.99907 6.56079 4.23794 6.65973 4.41406 6.83585L9.99999 12.4218L15.5859 6.83585C15.7621 6.65973 16.0009 6.56079 16.25 6.56079C16.4991 6.56079 16.7379 6.65973 16.9141 6.83585C17.0902 7.01197 17.1891 7.25085 17.1891 7.49992C17.1891 7.74899 17.0902 7.98786 16.9141 8.16398L10.6641 14.414C10.4868 14.5882 10.2485 14.6863 9.99999 14.6874Z"
                fill="#666576"
              />
            </svg>
          </span>
          {show && (
            <div className="absolute w-full bottom-10 bg-white border border-[#dcdbe1] rounded-lg left-0 z-10 shadow-lg">
              <h6
                onClick={() => limitHandler(10)}
                className={`text-sm py-2 px-3 cursor-pointer text-black font-medium hover:bg-gray-50 ${
                  pageSize === 10 ? "bg-indigo-50 text-indigo-600" : ""
                }`}
              >
                10 per page
              </h6>
              <h6
                onClick={() => limitHandler(24)}
                className={`text-sm py-2 px-3 cursor-pointer text-black font-medium hover:bg-gray-50 ${
                  pageSize === 24 ? "bg-indigo-50 text-indigo-600" : ""
                }`}
              >
                24 per page
              </h6>
              <h6
                onClick={() => limitHandler(50)}
                className={`text-sm py-2 px-3 cursor-pointer text-black font-medium hover:bg-gray-50 ${
                  pageSize === 50 ? "bg-indigo-50 text-indigo-600" : ""
                }`}
              >
                50 per page
              </h6>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-[#71737F]">
          Page {currentPage} of {totalPages}
        </span>
        
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            className={`p-2 rounded border ${
              currentPage > 1 
                ? "border-[#dcdbe1] hover:bg-gray-50 cursor-pointer" 
                : "border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            onClick={pageNumberDecrement}
            disabled={currentPage <= 1}
          >
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
              <path
                d="M15.8125 7.00004C15.8125 7.24868 15.7137 7.48714 15.5379 7.66295C15.3621 7.83877 15.1237 7.93754 14.875 7.93754H3.39064L7.41408 11.961C7.50148 12.0481 7.57082 12.1516 7.61814 12.2655C7.66546 12.3795 7.68982 12.5017 7.68982 12.625C7.68982 12.7484 7.66546 12.8706 7.61814 12.9846C7.57082 13.0985 7.50148 13.202 7.41408 13.2891C7.23716 13.4637 6.99859 13.5616 6.75001 13.5616C6.50144 13.5616 6.26286 13.4637 6.08595 13.2891L0.46095 7.6641C0.373551 7.57701 0.304203 7.47351 0.256886 7.35956C0.209568 7.2456 0.185211 7.12343 0.185211 7.00004C0.185211 6.87665 0.209568 6.75448 0.256886 6.64052C0.304203 6.52657 0.373551 6.42307 0.46095 6.33598L6.08595 0.710977C6.26207 0.534857 6.50094 0.435913 6.75001 0.435913C6.87334 0.435913 6.99546 0.460204 7.1094 0.5074C7.22334 0.554595 7.32687 0.623771 7.41408 0.710977C7.50128 0.798183 7.57046 0.901711 7.61765 1.01565C7.66485 1.12959 7.68914 1.25171 7.68914 1.37504C7.68914 1.49837 7.66485 1.62049 7.61765 1.73443C7.57046 1.84837 7.50128 1.9519 7.41408 2.0391L3.39064 6.06254H14.875C15.1237 6.06254 15.3621 6.16131 15.5379 6.33713C15.7137 6.51294 15.8125 6.7514 15.8125 7.00004Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`min-w-[40px] px-3 py-2 rounded border text-sm font-medium ${
                  currentPage === page
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-[#dcdbe1] text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            className={`p-2 rounded border ${
              currentPage < totalPages
                ? "border-[#dcdbe1] hover:bg-gray-50 cursor-pointer"
                : "border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            onClick={pageNumberIncrement}
            disabled={currentPage >= totalPages}
          >
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
              <path
                d="M15.5391 7.6641L9.91406 13.2891C9.73715 13.4637 9.49858 13.5616 9.25 13.5616C9.00142 13.5616 8.76285 13.4637 8.58594 13.2891C8.49854 13.202 8.42919 13.0985 8.38187 12.9846C8.33455 12.8706 8.3102 12.7484 8.3102 12.625C8.3102 12.5017 8.33455 12.3795 8.38187 12.2655C8.42919 12.1516 8.49854 12.0481 8.58594 11.961L12.6094 7.93754H1.125C0.87636 7.93754 0.637903 7.83877 0.462087 7.66295C0.286272 7.48714 0.1875 7.24868 0.1875 7.00004C0.1875 6.7514 0.286272 6.51294 0.462087 6.33713C0.637903 6.16131 0.87636 6.06254 1.125 6.06254H12.6094L8.58594 2.0391C8.40982 1.86298 8.31087 1.62411 8.31087 1.37504C8.31087 1.25171 8.33517 1.12959 8.38236 1.01565C8.42956 0.901711 8.49873 0.798183 8.58594 0.710977C8.67314 0.623771 8.77667 0.554595 8.89061 0.5074C9.00455 0.460204 9.12667 0.435913 9.25 0.435913C9.49907 0.435913 9.73794 0.534857 9.91406 0.710977L15.5391 6.33598C15.6265 6.42307 15.6958 6.52657 15.7431 6.64052C15.7904 6.75448 15.8148 6.87665 15.8148 7.00004C15.8148 7.12343 15.7904 7.2456 15.7431 7.35956C15.6958 7.47351 15.6265 7.57701 15.5391 7.6641Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}