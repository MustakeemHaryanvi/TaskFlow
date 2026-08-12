const API_URL = "http://127.0.0.1:8000";


const loginForm =
    document.getElementById("loginForm");


const message =
    document.getElementById("message");


const loginButton =
    document.getElementById("loginButton");



loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document.getElementById("email")
                .value
                .trim();


        const password =
            document.getElementById("password")
                .value;


        message.textContent =
            "Logging in...";


        message.style.color =
            "#2563eb";


        loginButton.disabled = true;


        try {

            const response =
                await fetch(
                    `${API_URL}/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Login failed"
                );

            }


            /*
             * Save JWT token
             */

            localStorage.setItem(
                "access_token",
                data.access_token
            );


            /*
             * Save user information
             */

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );


            message.textContent =
                "Login successful!";


            message.style.color =
                "#16a34a";


            /*
             * Open dashboard
             */

            setTimeout(
                function () {

                    window.location.href =
                        "index.html";

                },
                800
            );


        }

        catch (error) {

            console.error(error);


            message.textContent =
                error.message;


            message.style.color =
                "#dc2626";


            loginButton.disabled =
                false;
        }

    }
);