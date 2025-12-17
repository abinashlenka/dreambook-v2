
import { appendQueryParams } from "../server-apis/helper";
import { URL, responseValidator, apiError, getAuthToken } from "./helper";
export const getAllEmployee = async (payload) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    try{
        const response = await fetch(URL+`/book-assign/employee-emails`, requestOptions);
        return responseValidator(response);
    }
    catch(e){
        return apiError(e);
    }
}

export const assignBook = async (bookId, employeeEmail) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
    myHeaders.append("Content-Type", "application/json");
    const raw = JSON.stringify({ bookId, employeeEmail });
    const requestOptions = {
        method: "POST", 
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };
    try{
        const response = await fetch(URL+"/book-assign/assign-book", requestOptions)
        return responseValidator(response, true)
    }
    catch(e){
        return apiError(e)
    }
}


export const reAssignBook = async (bookId, employeeEmail) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
    myHeaders.append("Content-Type", "application/json");
    const raw = JSON.stringify({ bookId, employeeEmail });
    const requestOptions = {
        method: "POST", 
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };
    try{
        const response = await fetch(URL+"/book-assign/re-assign-book", requestOptions)
        return responseValidator(response, true)
    }
    catch(e){
        return apiError(e)
    }
}


export const addAuthor = async (payload) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
    myHeaders.append("Content-Type", "application/json");
    const raw = JSON.stringify(payload);
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
    try{
        const response = await fetch(URL+"/auth/add-author", requestOptions)
        return responseValidator(response, true)
    }
    catch(e){
        return apiError(e)
    }
}

