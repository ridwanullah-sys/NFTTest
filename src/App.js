// import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import NFT from "./pages/NFT";
import Home from "./pages/Home";
import Mint from "./pages/Mint";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const App = () => {
  return (
    <div className="">
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/NFTTest" element={<Home />} />
          <Route path="/NFTTest/nft" element={<NFT />} />
          <Route path="/NFTTest/mint" element={<Mint />} />
        </Routes>
      </Router>
      <ToastContainer />
    </div>
  );
};

// export default App;
