import { appendQueryParams } from "../server-apis/helper";
import { URL, responseValidator, apiError, getAuthToken } from "./helper";

export const getAllEmployees = async (payload) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(
      URL + `/users${appendQueryParams(payload)}`,
      requestOptions
    );
    return responseValidator(response);
  } catch (e) {
    return apiError(e);
  }
};

// ✅ Get overall dashboard stats (totals)
export const getDashboardStats = async () => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(
      URL + `/dashboard/stats`, // removed extra slash
      requestOptions
    );
    return responseValidator(response);
  } catch (e) {
    return apiError(e);
  }
};

// ✅ Get monthly sales report (month + year required)
export const getMonthlySales = async (month, year) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(
      URL + `/dashboard/sales-report?month=${month}&year=${year}`,
      requestOptions
    );
    return responseValidator(response);
  } catch (e) {
    return apiError(e);
  }
};

export const getAuthoursdashboard = async (id) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };
  try {
    const response = await fetch(
      URL + `/dashboard/authors-data/${id}`, // removed extra slash
      requestOptions
    );
    return responseValidator(response);
  } catch (e) {
    return apiError(e);
  }
  }


 export const getAuthorSalestReport = async ({ month, year, authorId }) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);

  const response = await fetch(
    `${URL}/dashboard/authors-sales-report/${authorId}?month=${month}&year=${year}`,
    { method: "GET", headers: myHeaders }
  );

  return responseValidator(response);
};


export const getAuthorRoyaltyReport = async ({ month, year,authorId }) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);

  const response = await fetch(
    `${URL}/dashboard/author-book-wise-report/${authorId}?month=${month}&year=${year}`,
    { method: "GET", headers: myHeaders }
  );

  return responseValidator(response);
};

export const getForAllAuthorRoyaltyReport = async ({ month, year }) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);

  const response = await fetch(
    `${URL}/dashboard/detail-book-wise-report?month=${month}&year=${year}`,
    { method: "GET", headers: myHeaders }
  );

  return responseValidator(response);
};



// ======================================================
// ✅ ROYALTY PAYMENT API FUNCTIONS (Admin & Employee Only)
// ======================================================

// Mark royalty as paid for all books
export const markRoyaltyAsPaidForAllBooks = async ({ month, year, paymentDate }) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      month: parseInt(month),
      year: parseInt(year),
      paymentDate: paymentDate || null
    }),
    redirect: "follow",
  };

  try {
    const response = await fetch(
      URL + `/dashboard/royalty/mark-all-paid`,
      requestOptions
    );
    return responseValidator(response);
  } catch (e) {
    return apiError(e);
  }
};

// Mark royalty as paid for specific author's books
export const markRoyaltyAsPaidForAuthor = async ({ authorId, month, year, paymentDate }) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      month: parseInt(month),
      year: parseInt(year),
      paymentDate: paymentDate || null
    }),
    redirect: "follow",
  };

  try {
    const response = await fetch(
      URL + `/dashboard/royalty/mark-paid/author/${authorId}`,
      requestOptions
    );
    return responseValidator(response);
  } catch (e) {
    return apiError(e);
  }
};

// Mark royalty as paid for specific book
export const markRoyaltyAsPaidForBook = async ({ bookId, month, year, paymentDate }) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      month: parseInt(month),
      year: parseInt(year),
      paymentDate: paymentDate || null
    }),
    redirect: "follow",
  };

  try {
    const response = await fetch(
      URL + `/dashboard/royalty/mark-paid/book/${bookId}`,
      requestOptions
    );
    return responseValidator(response);
  } catch (e) {
    return apiError(e);
  }
};

// Get royalty payment history
export const getRoyaltyPaymentHistory = async (authorId = null) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${await getAuthToken()}`);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const queryParam = authorId ? `?authorId=${authorId}` : '';
    const response = await fetch(
      URL + `/dashboard/royalty/payment-history${queryParam}`,
      requestOptions
    );
    return responseValidator(response);
  } catch (e) {
    return apiError(e);
  }
};

// ======================================================
// ✅ HELPER FUNCTIONS FOR ROYALTY PAYMENTS
// ======================================================

// Bulk mark royalty as paid for multiple authors
export const markRoyaltyAsPaidForMultipleAuthors = async ({ authorIds, month, year, paymentDate }) => {
  const results = [];
  
  for (const authorId of authorIds) {
    try {
      const result = await markRoyaltyAsPaidForAuthor({ 
        authorId, 
        month, 
        year, 
        paymentDate 
      });
      results.push({ authorId, success: true, data: result });
    } catch (error) {
      results.push({ authorId, success: false, error: error.message });
    }
  }
  
  return results;
};

// Bulk mark royalty as paid for multiple books
export const markRoyaltyAsPaidForMultipleBooks = async ({ bookIds, month, year, paymentDate }) => {
  const results = [];
  
  for (const bookId of bookIds) {
    try {
      const result = await markRoyaltyAsPaidForBook({ 
        bookId, 
        month, 
        year, 
        paymentDate 
      });
      results.push({ bookId, success: true, data: result });
    } catch (error) {
      results.push({ bookId, success: false, error: error.message });
    }
  }
  
  return results;
};

// Get payment status for specific period
export const getPaymentStatusForPeriod = async ({ month, year, authorId = null }) => {
  try {
    const history = await getRoyaltyPaymentHistory(authorId);
    
    if (history.status && history.data && history.data.payments) {
      const paymentsForPeriod = history.data.payments.filter(payment => {
        const paymentDate = new Date(payment.lastPaymentDate);
        const paymentMonth = paymentDate.getMonth() + 1;
        const paymentYear = paymentDate.getFullYear();
        
        return paymentMonth === parseInt(month) && paymentYear === parseInt(year);
      });
      
      return {
        status: true,
        data: {
          totalPayments: paymentsForPeriod.length,
          payments: paymentsForPeriod,
          period: { month: parseInt(month), year: parseInt(year) }
        }
      };
    }
    
    return { status: false, message: "No payment data found" };
  } catch (e) {
    return apiError(e);
  }
};
