// Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [first_name, setFirstName] = useState("");
    const [last_name, setLastName] = useState("");
    const [role, setRole] = useState("student");
    const [isRegister, setIsRegister] = useState(false)
    const navigate = useNavigate();

    const handleRegister = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5050/register", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
        first_name,
        last_name,
        email,
        password,
        role
        })
    });

    const data = await res.json();
    console.log(data);
    
    if (res.ok) {
        alert("Registration successful. You can now login.");
        setIsRegister(false);
    } else {
        alert(data.error);
    }
    };

    const handleLogin = async (e) => {
    e.preventDefault();

    try {
        const res = await fetch("http://localhost:5050/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok) {
            console.log("Login success:", data);
            alert("Login successful");
            navigate("/dashboard")
        } else {
            console.log("Login failed:", data);
            alert(data.error);
        } 
    } catch (err) {
        console.error(err);
        alert("Server error");
    }
    };

    return (
    <div>
    <h2>{isRegister ? "Register" : "Login"}</h2>

    <form onSubmit={isRegister ? handleRegister : handleLogin}>

        {isRegister && (
        <>
            <input
            placeholder="First Name"
            value={first_name}
            onChange={(e) => setFirstName(e.target.value)}
            />

            <input
            placeholder="Last Name"
            value={last_name}
            onChange={(e) => setLastName(e.target.value)}
            />

            <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="tutor">Tutor</option>
            </select>
        </>
        )}

        <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        />

        <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">
        {isRegister ? "Register" : "Login"}
        </button>
    </form>

    <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Already have an account? Login" : "Create account"}
    </button>

    </div>
);
    }