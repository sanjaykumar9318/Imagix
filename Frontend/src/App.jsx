import Navbar from "./components/Navbar"
import BuyCredit from "./pages/BuyCredit"
import HomePage from "./pages/HomePage"
import Result from "./pages/Result"
import {Routes,Route} from 'react-router-dom'
import StateStore from "./store/StateStore"
import Footer from "./components/Footer"
import Login from "./components/Login"
import { useEffect } from "react"


function App() {
  const { showLogin} = StateStore()
  const { loadCreditsData } = StateStore();

  useEffect(() => {
    console.log("App mounted");
   loadCreditsData();
  }, []);
  return (
    <div className='px-4 sm:px-10 md:px-14 lg:px-28 min-h-screen bg-gradient-to-b from-teal-50 to-orange-50 '>
      <Navbar/>
      {showLogin && <Login />}
    <Routes>
      <Route path='/' element={<HomePage/>}/>
      <Route path='/buy' element={<BuyCredit/>}/>
      <Route path='/result' element={<Result/>}/>
    </Routes>
      <Footer/>
    </div>
  )
}

export default App