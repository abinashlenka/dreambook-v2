import { appendQueryParams } from "../server-apis/helper";
import { URL, responseValidator, apiError, getAuthToken } from "./helper";

export const getAllEmployees = async (payload) => {
    try {
        const token = await getAuthToken();
        
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${token}`);
        myHeaders.append("Content-Type", "application/json");

        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        };

        const response = await fetch(`${URL}/users?role=employee${payload ? `&${new URLSearchParams(payload)}` : ''}`, requestOptions);
        
        if (response.status === 401) {
            // Try token refresh and retry once
            const newToken = await getAuthToken();
            myHeaders.set("Authorization", `Bearer ${newToken}`);
            const retryResponse = await fetch(`${URL}/users?role=employee${payload ? `&${new URLSearchParams(payload)}` : ''}`, {
                ...requestOptions,
                headers: myHeaders
            });
            return responseValidator(retryResponse);
        }

        return responseValidator(response);
    } catch (e) {
        if (e.message.includes('Authentication failed')) {
            window.location.href = '/login';
        }
        return apiError(e);
    }
};
export const getSingleEmployees = async (id) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    try{
        const response = await fetch(URL+`/users/${id}`, requestOptions);
        return responseValidator(response);
    }
    catch(e){
        return apiError(e);
    }
}

export const addEmployees = async (payload) => {
  try {
    const token = await getAuthToken(); // ✅ get token first

    const response = await fetch(`${URL}/auth/add-employee`, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${token}`, // ✅ lowercase
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    return responseValidator(response, true); // ✅ your existing handler
  } catch (e) {
    return apiError(e); // ✅ error handler
  }
};


export const editEmployees = async (payload, id) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
    myHeaders.append("Content-Type", "application/json");
    const raw = JSON.stringify(payload);
    const requestOptions = {
      method: "PATCH",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
    try{
        const response = await fetch(URL+`/users/employee/${id}`, requestOptions)
        return responseValidator(response, true)
    }
    catch(e){
        return apiError(e)
    }
}