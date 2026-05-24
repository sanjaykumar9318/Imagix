import { create } from "zustand";
import axios from "axios";
import { toast } from "react-toastify";
import axiosInstance from "../lib/axios.js";
const backendUrl = import.meta.env.VITE_BACKEND_URL;


const StateStore = create((set, get) => ({

  showLogin: true, 
  // for to close login form
  user: true,
  credit: 0,
  
  setShowLogin: (value) => set({ showLogin: value }),
  setToken: (value) => set({ token: value }),
  setUser: (value) => set({ user: value }),
  setCredit: (value) => set({ credit: value }),

  loadCreditsData: async () => {

    try {

    const res = await axiosInstance.get(
        "/user/credits")
    console.log(res.data)
    
    if (res.data.success) {
        set({
                credit: res.data.credits,
                user: res.data.user
            });
    }
} catch (error) {
    console.log(error);
    toast.error(
        error.response?.data?.message || error.message
    );
}
  },
 

  // GENERATE IMAGE
  generateImage: async (prompt, navigate) => {
    try {
        const { loadCreditsData } = get();
        const res = await axiosInstance.post(
            "/image/generate-image",
            { prompt }
        );
        console.log(res.data.resultImage)
        if (res.data.success) {
            await loadCreditsData();
            return res.data.resultImage;
        } else {
            toast.error(res.data.message);
            await loadCreditsData();
            if (res.data.creditBalance === 0) {
                navigate("/buy");
            }
        }
    } catch (error) {
        toast.error(
            error.response?.data?.message || error.message
        );
    }
},
 // LOGOUT
  logout: async() => {
    console.log("logoutclicked")
    try{
      await axiosInstance.post('/user/logout')
      set({user: null,
        credit:0
      });
    }
    catch(err){
      console.log(err.message)
    }
    
  }
}));

export default StateStore;