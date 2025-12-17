import { appendQueryParams } from "../server-apis/helper";
import { URL, responseValidator, apiError, getAuthToken } from "./helper";


export const getLatestdate = async (id) => {
  const token = await getAuthToken();
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token}`);

  const response = await fetch(`${URL}/flipkart/latest-date`, {
    method: "GET",
    headers,
    redirect: "follow"
  });

  return await response.json();
};

export const addFlipkartOrders = async (payload) => {
    try {
        const token = await getAuthToken(); // ✅ Get authentication token
        console.log("payload", payload);
        const response = await fetch(`${URL}/flipkart/add`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json", // ✅ Important for JSON
            },
            body: JSON.stringify(payload), // ✅ Convert JS object/array to JSON string
            redirect: "follow",
        });

        const json = await response.json();
        console.log("📦 addFlipkartOrders response:", json);
        return json;
    } catch (error) {
        console.error("❌ addFlipkartOrders error:", error);
        throw error;
    }
};

// export const addFlipkartOrders = async (payload) => {
//   try {
//     const token = await getAuthToken(); // ✅ get token first

//     const response = await fetch(`${URL}/flipkart/add`, {
//       method: "POST",
//       headers: {
//         "authorization": `Bearer ${token}`, // ✅ lowercase
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(payload),
//       redirect: "follow",
//     });

//     return responseValidator(response, true); // ✅ your existing handler
//   } catch (e) {
//     return apiError(e); // ✅ error handler
//   }
// };