import { URL, apiError, getAuthToken } from "./helper";

// Get all notifications for a user
export const getUserNotification = async (id) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(`${URL}/notifications/${id}`, requestOptions);
    return response.json();
  } catch (e) {
    return apiError(e);
  }
};

// MARK SINGLE NOTIFICATION AS READ
export const markNotificationAsRead = async (id) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
  const requestOptions = {
    method: "PUT",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(`${URL}/notifications/${id}/read`, requestOptions);
    return response.json();
  } catch (e) {
    return apiError(e);
  }
};

// MARK ALL NOTIFICATIONS AS READ
export const markAllAsRead = async (id) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
  const requestOptions = {
    method: "PUT",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(`${URL}/notifications/clear-all/${id}`, requestOptions);
    return response.json();
  } catch (e) {
    return apiError(e);
  }
};

// DELETE SINGLE NOTIFICATION
export const deleteNotification = async (id) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
  const requestOptions = {
    method: "DELETE",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(`${URL}/notifications/${id}`, requestOptions);
    return response.json();
  } catch (e) {
    return apiError(e);
  }
};

// DELETE ALL NOTIFICATIONS
export const deleteAllNotifications = async () => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
  const requestOptions = {
    method: "DELETE",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(`${URL}/notifications/clear-all`, requestOptions);
    return response.json();
  } catch (e) {
    return apiError(e);
  }
};
