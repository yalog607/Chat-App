import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import { useState } from "react";
import { toast } from "react-hot-toast";

function LoginPage() {
  const {login, isLoggingIn} = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const checkValidate = ()=> {
    if(!formData.email.trim()) return toast.error("Email is required");
    if(!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) return toast.error("Invalid email format");
    if(!formData.password) return toast.error("Password is required");
    if(formData.password.length < 6) return toast.error("Password must be at least 6 characters");

    return true;
  }

  const handleSubmit = (event)=> {
    event.preventDefault();
    const success = checkValidate();
    if (success === true) login(formData);
  }
  
  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold">Login now!</h1>
          <p className="py-6">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Expedita
            atque quasi perspiciatis obcaecati incidunt iste culpa ab dolores
            ullam eaque aspernatur cumque blanditiis veniam non, inventore vel.
            Tempora, corporis nam?
          </p>
        </div>
        <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
          <div className="card-body">
            <fieldset className="fieldset">
              <label className="label">Email</label>
              <input type="email" value={formData.email} className="input" placeholder="mail@site.com" onChange={e=> setFormData({...formData, email: e.target.value})}/>
              <label className="label">Password</label>
              <input type="password" value={formData.password} className="input" placeholder="Password" onChange={e=> setFormData({...formData, password: e.target.value})}/>
              <button className="btn btn-neutral mt-4" onClick={handleSubmit} disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <div>
                    <span className="loading loading-spinner loading-xl"></span>
                    Loading...
                  </div>
                ) : "Login"}
              </button>
              <div>
                <p className="">You do not have an account? <Link className="link link-hover" to="/signup">Sign up</Link></p>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
