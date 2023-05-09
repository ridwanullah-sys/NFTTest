// import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NFT from "./pages/NFT";
import Home from "./pages/Home";
import Mint from "./pages/Mint";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const App = () => {
  return (
    <div className="">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nft" element={<NFT />} />
          <Route path="/mint" element={<Mint />} />
        </Routes>
      </Router>
      <ToastContainer />
    </div>
  );
};

// export default App;
