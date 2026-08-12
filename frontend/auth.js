// =====================================================
// TASKFLOW AUTHENTICATION
// =====================================================

// Backend API URL
const API_BASE_URL = "http://127.0.0.1:8000";


// =====================================================
// GET TOKEN
// =====================================================

function getToken() {
    return localStorage.getItem("taskflow_token");
}


// =====================================================
// SAVE TOKEN
// =====================================================

function saveToken(token) {

    if (!token) {
        console.error("No token received.");
        return;
    }

    localStorage.setItem("taskflow_token", token);
}


// =====================================================
// REMOVE TOKEN
// =====================================================

function removeToken() {

    localStorage.removeItem("taskflow_token");

    localStorage.removeItem("taskflow_user");
}


// =====================================================
// GET SAVED USER
// =====================================================

function getSavedUser() {

    const user = localStorage.getItem("taskflow_user");

    if (!user) {
        return null;
    }

    try {

        return JSON.parse(user);

    } catch (error) {

        console.error(
            "Invalid saved user data:",
            error
        );

        return null;
    }
}


// =====================================================
// SAVE USER
// =====================================================

function saveUser(user) {

    if (!user) {
        return;
    }

    localStorage.setItem(
        "taskflow_user",
        JSON.stringify(user)
    );
}


// =====================================================
// AUTH HEADERS
// =====================================================

function authHeaders() {

    const token = getToken();

    return {

        "Content-Type": "application/json",

        "Authorization": `Bearer ${token}`

    };
}


// =====================================================
// CHECK LOGIN / JWT VALIDATION
// =====================================================

async function checkAuthentication() {

    const token = getToken();


    // No token = not logged in

    if (!token) {

        return false;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/me`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        // Token invalid / expired

        if (!response.ok) {

            removeToken();

            return false;
        }


        // Get current user

        const user = await response.json();


        // Save latest user information

        saveUser(user);


        return true;


    } catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );

        return false;
    }
}


// =====================================================
// PROTECT DASHBOARD
// =====================================================

async function requireAuth() {

    const authenticated =
        await checkAuthentication();


    // User is NOT logged in

    if (!authenticated) {

        window.location.replace("login.html");

        return false;
    }


    // User is logged in

    document.body.style.visibility = "visible";


    return true;
}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    // Remove JWT and user data

    removeToken();


    // Send user back to login

    window.location.replace("login.html");
}


// =====================================================
// GET CURRENT USER
// =====================================================

async function getCurrentUser() {

    const token = getToken();

    if (!token) {

        return null;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/me`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (!response.ok) {

            removeToken();

            return null;
        }


        const user = await response.json();


        saveUser(user);


        return user;


    } catch (error) {

        console.error(
            "Failed to get current user:",
            error
        );

        return null;
    }
}


// =====================================================
// AUTHENTICATED FETCH
// =====================================================

async function authenticatedFetch(
    url,
    options = {}
) {

    const token = getToken();


    // No token

    if (!token) {

        window.location.replace("login.html");

        return null;
    }


    // Existing headers

    const headers = {

        ...(options.headers || {}),

        "Authorization": `Bearer ${token}`,

        "Content-Type": "application/json"

    };


    try {

        const response = await fetch(
            `${API_BASE_URL}${url}`,
            {
                ...options,
                headers: headers
            }
        );


        // JWT expired / invalid

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            removeToken();

            window.location.replace("login.html");

            return null;
        }


        return response;


    } catch (error) {

        console.error(
            "API request failed:",
            error
        );

        throw error;
    }
}