import { useState } from "react";

function Register() {
    const [first_name, setFirstName] = useState("");
    const [last_name, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [isRegister, setIsRegister] = useState(false)

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

    return (
    <form onSubmit={handleRegister}>
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

    <input
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

    <select value={role} onChange={(e) => setRole(e.target.value)}>
    <option value="student">Student</option>
    <option value="tutor">Tutor</option>
    </select>

    <button type="submit">Register</button>
    </form>
    );
}

export default Register;