// import axios from "axios";

// const API_BASE_URL = "https://dream-book-backend-main.vercel.app/api";

// export const getAllOrders = async ({ bookId }) => {
//     try {
//       const res = await axios.get(`https://dream-book-backend-main.vercel.app/api/orders?bookId=${bookId}`);
//       return { status: true, data: res.data.results || [] }; // <-- ensure it's an array
//     } catch (error) {
//       console.error("❌ Error fetching orders:", error);
//       return { status: false, error };
//     }
//   };
// src/services/APIs/orders.js
import axios from "axios";
import { URL, getAuthToken } from "./helper";

// 🔹 Get all orders
export const getAllOrders = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${URL}/orders${query ? `?${query}` : ""}`;

    const res = await axios.get(url);

    const orders = Array.isArray(res.data)
      ? res.data
      : res.data?.data || [];

    return { status: true, data: orders };
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return { status: false, error };
  }
};

// 🔹 Get orders by product name
export const getOrdersByName = async (name, bookId) => {
  try {
    const token = await getAuthToken();

    const res = await axios.get(`${URL}/orders/by-name/${name}/${bookId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Destructure orders and book from response
    const { orders = [], book = null } = res.data;

    return { status: true, data: { orders, book } };
  } catch (error) {
    console.error("❌ Error fetching orders by name:", error);
    return { status: false, error };
  }
};


// 🔹 Get orders by product name with optional month/year filter
export const getRoyaltyDetails = async (name, bookId, month, year) => {
  try {
    const token = await getAuthToken();

    const queryParams = new URLSearchParams();
    if (month) queryParams.append("month", month);
    if (year) queryParams.append("year", year);

    const res = await axios.get(
      `${URL}/orders/get-royalty/${name}/${bookId}?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return { status: true, data: res.data }; // ✅ no extra wrapping
  } catch (error) {
    console.error("❌ Error fetching orders by name:", error);
    return { status: false, error };
  }
};

