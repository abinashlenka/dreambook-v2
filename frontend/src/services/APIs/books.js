
import { URL, responseValidator, apiError, getAuthToken } from "./helper";


// const URL = "https://dream-book-backend-main.vercel.app/api";
const prefix = "/api";

// ✅ Add a new book (Fixed `fetch` URL & added Authorization)
export const addBook = async (payload) => {
  const token = await getAuthToken(); // Get the authentication token
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token}`);

  const response = await fetch(`${URL}/books`, {
    method: "POST",
    headers,
    body: payload,
    redirect: "follow"
  });

  const json = await response.json();
  console.log("📦 addBook response:", json); // <-- debug log
  return json;
};

// ✅ Fetch single book with Firebase Bearer token
export const getSingleBook = async (id) => {
  const token = await getAuthToken();
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token}`);

  const response = await fetch(`${URL}/books/${id}`, {
    method: "GET",
    headers,
    redirect: "follow"
  });

  return await response.json();
};

// ✅ Fetch all books with filters
export const getAllBooks = async (payload = { page: 1, limit: 10 }) => {
  const token = await getAuthToken();  // 🔑 get Firebase ID token
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token}`);

  const query = new URLSearchParams();

  if (payload.page) query.append("page", payload.page);
  if (payload.limit) query.append("limit", payload.limit);
  if (payload.search) query.append("search", payload.search);
  if (payload.keyword) query.append("keyword", payload.keyword);
  if (payload.status) query.append("status", payload.status);
  if (payload.sort) query.append("sort", payload.sort);

  const response = await fetch(`${URL}/books?${query.toString()}`, {
    method: "GET",
    headers,  // ✅ fixed
  });

  return await response.json();
};


export const getAssignedBooks = async (payload = { page: 1, limit: 10 }, userId) => {
  try {
    const token = await getAuthToken();
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);
    console.log("Auth token:", token);

    const query = new URLSearchParams();
    if (payload.page) query.append("page", payload.page);
    if (payload.limit) query.append("limit", payload.limit);
    if (payload.search) query.append("search", payload.search);
    if (payload.keyword) query.append("keyword", payload.keyword);
    if (payload.status) query.append("status", payload.status);
    if (payload.sort) query.append("sort", payload.sort);

    const response = await fetch(`${URL}/books/assigned/list/${userId}?${query.toString()}`, {
      method: "GET",
      headers,
      redirect: "follow",
    });

    return await response.json();
  } catch (err) {
    console.error("❌ Error fetching assigned books:", err);
    return { status: false, data: [], message: "Failed to fetch assigned books" };
  }
};


// ✅ Edit book (including status change)
export const editBook = async (payload, id) => {
  const token = await getAuthToken();
  const headers = new Headers();

  headers.append("Authorization", `Bearer ${token}`);

  if (!token) {
    return { status: false, code: 401, message: "Session expired" };
  }

  try {
    const response = await fetch(`${URL}/books/${id}`, {
      method: "PATCH",
      headers,
      body: payload,
    });

    const json = await response.json();
    return json;
  } catch (err) {
    console.error("❌ editBook error:", err);
    return { status: false, message: err.message };
  }
};

// ✅ Edit book (including status change)
export const updateStatus = async (payload, id) => {
  const token = await getAuthToken();
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token}`);
  headers.append("Content-Type", "application/json"); // ✅ add this

  if (!token) {
    return { status: false, code: 401, message: "Session expired" };
  }

  try {
    const response = await fetch(`${URL}/books/assign/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    return json;
  } catch (err) {
    console.error("❌ updateStatus error:", err);
    return { status: false, message: err.message };
  }
};



export const addAuthorInBook = async (payload, id) => {
  const token = await getAuthToken();
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token}`);
  headers.append("Content-Type", "application/json"); // ✅ Important!

  console.log("come in");

  if (!token) {
    return { status: false, code: 401, message: "Session expired" };
  }

  try {
    const response = await fetch(`${URL}/books/addAuthor`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload), // ✅ stringify payload
    });

    console.log("response", response);

    const json = await response.json();
    return json;
  } catch (err) {
    console.error("❌ addAuthorInBook error:", err);
    return { status: false, message: err.message };
  }
};


export const deleteBook = async (bookId) => {
  const token = await getAuthToken(); // Get the authentication token
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token}`);

  const response = await fetch(`${URL}/books/${bookId}`, {
    method: "DELETE",
    headers,
    redirect: "follow"
  });

  const json = await response.json();
  console.log("🗑️ deleteBook response:", json); // <-- debug log
  return json;
};

