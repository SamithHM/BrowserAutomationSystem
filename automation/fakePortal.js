import express from "express";

const app = express();

const PORT = 4000;

app.use(express.urlencoded({ extended: true }));

// -------------------------
// HOME PAGE
// -------------------------

app.get("/", (req, res) => {

    res.send(`
        <h1>Fake Government Portal</h1>

        <p>Portal is running successfully.</p>

        <a href="/login">Go to Login</a>
    `);

});

// -------------------------
// LOGIN PAGE
// -------------------------

app.get("/login", (req, res) => {

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fake Government Portal</title>
        </head>

        <body>

            <h1>Government Application Portal</h1>

            <h2>Login</h2>

            <form method="POST" action="/login">

                <label>Username</label>
                <input
                    type="text"
                    name="username"
                    id="username"
                />

                <br><br>

                <label>Password</label>
                <input
                    type="password"
                    name="password"
                    id="password"
                />

                <br><br>

                <button type="submit">
                    Login
                </button>

            </form>

        </body>
        </html>
    `);
});


// -------------------------
// LOGIN PROCESS
// -------------------------

app.post("/login", (req, res) => {

    console.log("POST /login received");
    const { username, password } = req.body;

    if (
        username === "testuser" &&
        password === "testpass"
    ) {
        console.log("LOGIN SUCCESS");

        res.setHeader(
            "Set-Cookie",
            "loggedIn=true; Path=/application"
        );
        console.log("Cookie set");
        res.redirect("/application");

    } else {

        res.send("Invalid username or password");
    }
});


// -------------------------
// APPLICATION PAGE
// -------------------------

app.get("/application", (req, res) => {

    console.log("GET /application received");
    const cookies = req.headers.cookie || "";
    console.log("Cookies received:", cookies);

    if (!cookies.includes("loggedIn=true")) {

        console.log("No login cookie");
        console.log("Redirecting to /login");

        return res.redirect("/login");
    }

    console.log("Login cookie found");
    console.log("Showing application form");

    res.send(`
        <!DOCTYPE html>

        <html>

        <head>
            <title>Application Form</title>
        </head>

        <body>

            <h1>Application Form</h1>

            <form method="POST" action="/application">

                <label>Name</label>

                <input
                    type="text"
                    name="name"
                    id="name"
                />

                <br><br>


                <label>Email</label>

                <input
                    type="email"
                    name="email"
                    id="email"
                />

                <br><br>


                <label>Phone</label>

                <input
                    type="text"
                    name="phone"
                    id="phone"
                />

                <br><br>


                <button type="submit">
                    Submit Application
                </button>

            </form>

        </body>

        </html>
    `);
});


// -------------------------
// SUBMIT APPLICATION
// -------------------------

app.post("/application", (req, res) => {

    const {
        name,
        email,
        phone
    } = req.body;

    const acknowledgementNumber =
        "ACK-" +
        Date.now();

    res.send(`
        <!DOCTYPE html>

        <html>

        <head>
            <title>Application Submitted</title>
        </head>

        <body>

            <h1>Application Submitted Successfully</h1>

            <p>
                Name: ${name}
            </p>

            <p>
                Email: ${email}
            </p>

            <p>
                Phone: ${phone}
            </p>

            <h2>
                Acknowledgement Number:
                <span id="acknowledgement">
                    ${acknowledgementNumber}
                </span>
            </h2>

        </body>

        </html>
    `);
});


app.listen(PORT, () => {

    console.log(
        `Fake portal running at http://localhost:${PORT}`
    );

});