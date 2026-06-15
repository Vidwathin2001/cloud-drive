import { useState } from "react";
import { API } from "../api";

export default function Register(props) {

  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const register = async () => {
    try {

      await API.post("/auth/register", data);

      alert("Registered successfully");

      props.goLogin();

    } catch (err) {

      console.log(err);

      alert("Registration failed");
    }
  };

  return (
    <div className="auth-container">

      <div className="auth-box">

        <h2>Register</h2>

        <input
          type="text"
          placeholder="Name"
          onChange={(e) =>
            setData({ ...data, name: e.target.value })
          }
        />

        <input
          type="email"
          placeholder="Email"
          onChange={(e) =>
            setData({ ...data, email: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) =>
            setData({ ...data, password: e.target.value })
          }
        />

        <button onClick={register}>
          Register
        </button>

        <div className="auth-link">
          Already have an account?{" "}

          <span onClick={props.goLogin}>
            Login
          </span>
        </div>

      </div>

    </div>
  );
}