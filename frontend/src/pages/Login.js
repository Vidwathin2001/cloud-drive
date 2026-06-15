// pages/Login.js
import { useState } from "react";
import { API } from "../api";

export default function Login(props) {
  const [data, setData] = useState({ email: "", password: "" });

const [remember, setRemember] = useState(false);
const [showPassword, setShowPassword] = useState(false);

const login = async () => {
  try {
    const res = await API.post("/auth/login", data);

    // ✅ If remember me checked → keep login even after browser close
    if (remember) {

  localStorage.setItem(
    "token",
    res.data.token
  );

  localStorage.setItem(
    "userName",
    data.email
  );
}
    
    // ✅ Else → logout when browser/tab closes
    else {
      sessionStorage.setItem(
  "token",
  res.data.token
);

localStorage.setItem(
  "userName",
  data.email
);
    }

    window.location = "/";

  } catch (err) {
    console.log(err.response?.data);

    alert(err.response?.data?.message || "Login failed");
  }
};

 return (
  <div className="auth-container">

    <div className="auth-box">

      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        onChange={(e) =>
          setData({ ...data, email: e.target.value })
        }
      />

      <div
  style={{
    position: "relative",
    width: "100%"
  }}
>
  <input
    type={
      showPassword
        ? "text"
        : "password"
    }

    placeholder="Password"

    value={data.password}

   onChange={(e) =>
  setData({
    ...data,
    password: e.target.value
  })
}

    style={{
      width: "100%",
      padding: "14px",
      borderRadius: "12px",
      border: "1px solid #ccc",
      fontSize: "16px",
      boxSizing: "border-box"
    }}
  />

  <span
    onMouseDown={() =>
      setShowPassword(true)
    }

    onMouseUp={() =>
      setShowPassword(false)
    }

    onMouseLeave={() =>
      setShowPassword(false)
    }

    style={{
      position: "absolute",
      right: "15px",
      top: "50%",
      transform:
        "translateY(-50%)",
      cursor: "pointer",
      userSelect: "none"
    }}
  >
    👁
  </span>
</div>

     <div className="remember-box">

  <input
    type="checkbox"
    id="remember"
    checked={remember}
    onChange={() => setRemember(!remember)}
  />

  <label htmlFor="remember">
    Remember Me
  </label>

</div>

<button onClick={login}>
  Login
</button>

      <div className="auth-link">
        Don't have an account?{" "}

        <span onClick={props.goRegister}>
          Register
        </span>
      </div>

    </div>

  </div>
);
}