const authorPermissions = {
    "admin": {
        "dashboard": true,
        "books": true,
        "authors": true,
        "employees": true,
        "settings": true,
        "payNow": false,
        "editBook": true,
        "bookAssign": true,
        "rejectBook": true,
        "addAuthorToBook":true,
        "deleteBook":true,
        "flipkart": true
        

    },
    "author":{
        "dashboard": true,
        "books": true,
        "authors": false,
        "employees": false,
        "settings": true,
        "payNow": false,
        "editBook": false,
        "bookAssign": false,
        "rejectBook": true,
        "addAuthorToBook":false,
        "deleteBook":false,
        "flipkart": false


    },
    "employee":{
        "dashboard": true,
        "books": true,
        "authors": true,
        "employees": false,
        "settings": true,
        "payNow": false,
        "editBook": true,
        "bookAssign": false,
        "rejectBook": false,
        "addAuthorToBook":true,
        "deleteBook":false,
        "flipkart": true

    },
    
}
export const permissionHandler = (option, role) => {
    if(authorPermissions[role]?.[option]){
      return true;
    }
    else return false;
}
