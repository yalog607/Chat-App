import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";

function Navbar() {
  const { authUser, signout } = useAuthStore();

  const handleLogout = (e) => {
    e.preventDefault();
    signout();
  }
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <Link to={{pathname: "/"}} className="btn btn-ghost text-xl">Chat App</Link>
      </div>
      {authUser ? <div className="flex gap-2 items-center justify-center">
        <div className="badge badge-soft badge-ghost ">
          <span className="text-gray-700">{authUser.fullName}</span>
        </div>
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img
                alt="Tailwind CSS Navbar component"
                src={authUser.profilePic || "./avatar.png"} />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
            <li>
              <Link className="justify-between" to={{pathname: "/profile"}}>
                Profile
              </Link>
            </li>
            {/* <li><a>Settings</a></li> */}
            <li><a onClick={handleLogout}>Logout</a></li>
          </ul>
        </div>
      </div> 
      : <></>}
      
    </div>
  )
}

export default Navbar