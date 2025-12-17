import { URL, apiError, getAuthToken, responseValidator } from './helper';

export const registerEmployer = async (formdata) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow"
    };
    try{
        const response = await fetch(URL+"/employerRegister", requestOptions);
        return responseValidator(response);
    }
    catch(e){
        return apiError(e);
    }
}

export const loginEmployer = async (tt) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${tt}`);
    myHeaders.append("Content-Type", "application/json");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(URL + "/auth/login", {
            method: "POST",
            headers: myHeaders,
            redirect: "follow",
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }
        
        return responseValidator(response);
    } catch (e) {
        clearTimeout(timeoutId);
        return apiError(e);
    }
};
export const updateProfile = async (payload, id, role) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`)
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify(payload);

  const requestOptions = {
    method: "PATCH",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  try {
    const response = await fetch(`${URL}/users/${role}/${id}`, requestOptions);
    return responseValidator(response, true);
  } catch (e) {
    return apiError(e);
  }
};
