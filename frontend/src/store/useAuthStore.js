import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5002/" : "/";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isLoggingIn: false,
    isSigningUp: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async() => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({authUser: res.data});
            get().connectSocket();
        } catch (error) {
            console.log("Error in useAuthStore: ", error);
            set({authUser: null})
        } finally {
            set({isCheckingAuth: false})
        }
    },
    signup: async(data) => {
        set({isSigningUp: true});
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({authUser: res.data});
            get().connectSocket();
            toast.success("Account created successfully");
        } catch (error) {
            console.log("Error in useAuthStore: ", error);
            toast.error(error.response.data.message);
        } finally {
            set({isSigningUp: false});
        }
    },
    login: async(data) => {
        set({isLoggingIn: true});
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({authUser: res.data});
            get().connectSocket();
            toast.success("Login successfully");
        } catch (error) {
            console.log("Error in useAuthStore: ", error);
            toast.error(error.response.data.message);
        } finally {
            set({isLoggingIn: false});
        }
    },
    signout: async()=> {
        try {
            await axiosInstance.post("/auth/signout");
            set({authUser: null});
            get().disconnectSocket();
            toast.success("Log out successfully");
        } catch (error) {
            console.log("Error in useAuthStore: ", error);
            toast.error(error.response.data.message);
        }
    },
    updateProfile: async(data) => {
        set({isUpdatingProfile: true});
        try {
            const res = await axiosInstance.put("auth/update-profile", data);
            set({authUser: res.data});
            toast.success("Profile update successfully");
        } catch (error) {
            console.log("Error in useAuthStore: ", error);
            toast.error(error.response.data.message);
        } finally {
            set({isUpdatingProfile: false});
        }
    },
    connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}))