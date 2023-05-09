// import './App.css';
import React, { useCallback, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NFT from "./pages/NFT";
import Home from "./pages/Home";
import { ModalProvider } from "@particle-network/connect-react-ui";
import {
  Chain,
  ConnectButton,
  useAccount,
  useConnectKit,
  useParticleTheme,
  useSwitchChains,
  useParticleProvider,
  useLanguage,
} from "@particle-network/connect-react-ui";

import "@particle-network/connect-react-ui/dist/index.css";
import { LoginOptions } from "@particle-network/auth";

export const App = () => {
  const account = useAccount();
  const connectKit = useConnectKit();
  const { theme, setTheme } = useParticleTheme();
  const { language, changLanguage } = useLanguage();

  const provider = useParticleProvider();

  const { isSwtichChain, renderChains } = useSwitchChains();

  useEffect(() => {
    async function chainChanged(chain) {
      console.log("DEMO-onChainChanged：", chain);
    }
    if (connectKit) {
      connectKit.on("chainChanged", chainChanged);
      return () => {
        connectKit.removeListener("chainChanged", chainChanged);
      };
    }
  }, [connectKit]);

  const LogRenderChains = useCallback(() => {
    console.log("isSwtichChain:", isSwtichChain);
    console.log("renderChains:", renderChains);
  }, [renderChains, isSwtichChain]);
  return (
    <div className="">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nft" element={<NFT />} />
        </Routes>
      </Router>
    </div>
  );
};

// export default App;
