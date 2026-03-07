// Test registration
fetch("http://localhost:5050/register", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
first_name: "Preston",
last_name: "Paris",
email: "preston@test.com",
password: "1234",
role: "student"
})
})
.then(res => res.json())
.then(data => console.log(data))

// Test Login
fetch("http://localhost:5050/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
    email: "preston@test.com",
    password: "1234"
    })
})
.then(res => res.json())
.then(data => console.log(data))