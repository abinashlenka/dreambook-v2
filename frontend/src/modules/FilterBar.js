import React, { useState, useEffect } from "react";
import CategoryStatus from "./CategoryStatus";
import DateModal from "./DateModal";
import StatusModal from "./StatusModal";

export default function FilterBar(props) {
  const [statusModal, setStatusModal] = useState(false);
  const [sortModal, setSortModal] = useState(false);
  const [sort, setSort] = useState(props.currentFilters?.sort || "");
  const [status, setStatus] = useState(props.currentFilters?.status || "");
  const [search, setSearch] = useState(props.currentFilters?.search || "");



  useEffect(() => {
    if (props.currentFilters) {
      setSort(props.currentFilters.sort || "");
      setStatus(props.currentFilters.status || "");
      setSearch(props.currentFilters.search || "");
    }
  }, [props.currentFilters]);

  const statusModalHandler = () => {
    setStatusModal(!statusModal);
    if (sortModal) setSortModal(false);
  };

  const sortModalhandler = () => {
    setSortModal(!sortModal);
    if (statusModal) setStatusModal(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusModal || sortModal) {
        if (!event.target.closest(".filter-dropdown")) {
          setStatusModal(false);
          setSortModal(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [statusModal, sortModal]);

  const searchHandler = (e) => {
    const searchValue = e.target.value;
    setSearch(searchValue);
    // Call the main handler which will route to the correct search handler
    props.handler(
      searchValue,
      undefined, // status
      undefined, // page
      undefined, // limit
      undefined  // sort
    );
  };

  const filtersHandler = (val) => {
    setStatus(val);
    setStatusModal(false);
    props.handler(
      search,
      val,
      props.currentFilters?.page || 1,
      props.currentFilters?.limit || 12,
      sort
    );
  };

  const filtersSortHandler = (val) => {
    setSort(val);
    setSortModal(false);
    props.handler(
      search,
      status,
      props.currentFilters?.page || 1,
      props.currentFilters?.limit || 12,
      val
    );
  };

  return (
    <div className="w-full flex items-center gap-3 py-3 px-5 bg-white rounded-t-md">
      {/* Search Input - ✅ Always enabled now */}
      <div className="w-4/15 rounded-lg flex items-center gap-2 border border-solid border-[#DCDBE1] py-2 px-4 relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="..." fill="#B3B2BD" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={searchHandler}
          className="w-10/12 outline-none"
          placeholder={"Search..."}
          disabled={props.disabled}
        />
      </div>

      
      {props.sort && (
        <div
          onClick={sortModalhandler}
          className="filter-dropdown rounded-lg cursor-pointer flex items-center gap-2 border border-solid border-[#DCDBE1] py-2 px-4 relative"
        >
          <h6 className="font-normal text-sm text-[#17161D]">Sort</h6>
          {sortModal && <DateModal value={sort} handler={filtersSortHandler} />}
        </div>
      )}
    </div>
  );
}