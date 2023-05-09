import React, { useState, useEffect, useMemo } from "react";
import "../component/navbar.css";
import { Link } from "react-router-dom";
import meta from "../Assets/images/meta-nav.png";
import { ConnectButton } from "@particle-network/connect-react-ui";
import "@particle-network/connect-react-ui/dist/index.css";
import { isNullish, SettingOption, toBase58Address } from "@particle-network/auth";
import { ParticleNetwork, WalletCustomStyle, WalletEntryPosition } from "@particle-network/auth";
import { ParticleChains } from "@particle-network/common";
import { AuthType, AuthTypes } from "@particle-network/auth";
import { ParticleProvider } from "@particle-network/provider";
import { SolanaWallet } from "@particle-network/solana-wallet";
import Web3 from "web3";
import { fromSunFormat } from "../utils/number";
import { customStyle as defCustomStyle } from "../config";

const Navbar = () => {
  const [loginLoading, setLoginLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [loginState, setLoginState] = useState(false);
  const [balance, setBalance] = useState(0);
  const [address, setAddress] = useState("");
  const [loginAccount, setLoginAccount] = useState();
  const loadChainKey = () => {
    const key = localStorage.getItem("dapp_particle_chain_key");
    if (key && ParticleChains[key]) {
      return key;
    }
    return "Ethereum";
  };

  const [demoSetting, setDemosetting] = useState({
    loginAccount: "",
    chainKey: loadChainKey(),
    language: localStorage.getItem("dapp_particle_language") || "en",
    loginFormMode: !!localStorage.getItem("dapp_particle_form_mode") ? "true" : "false",
    promptMasterPasswordSettingWhenLogin: Number(localStorage.getItem("promptMasterPasswordSettingWhenLogin") || "2"),
    promptSettingWhenSign: Number(localStorage.getItem("promptSettingWhenSign") || "1"),
    theme: localStorage.getItem("dapp_particle_theme") || "light",
    customStyle: localStorage.getItem("customStyle") || JSON.stringify(defCustomStyle),
    modalBorderRadius: Number(localStorage.getItem("dapp_particle_modal_border_radius") || 10),
    walletEntrance:
      localStorage.getItem("dapp_particle_walletentrance") === "true" ||
      isNullish(localStorage.getItem("dapp_particle_walletentrance")),
    walletTheme: localStorage.getItem("dapp_particle_wallettheme") || "light",
    fiatCoin: localStorage.getItem("web_demo_fiat_coin") || "USD",
  });

  useEffect(() => {
    if (loginState) {
      initAccount();
    }
  }, [loginState, demoSetting.chainKey]);

  const particle = useMemo(() => {
    const {
      theme,
      modalBorderRadius,
      language,
      promptSettingWhenSign,
      promptMasterPasswordSettingWhenLogin,
      customStyle,
      walletEntrance,
      walletTheme,
      fiatCoin,
    } = demoSetting;
    const chainChanged = (chain) => {
      initAccount();
    };
    const disconnect = () => {
      setLoginState(false);
    };
    if (window.particle) {
      window.particle.auth.off("chainChanged", chainChanged);
      window.particle.auth.off("disconnect", disconnect);
      window.particle.walletEntryDestroy();
    }
    const chainKey = localStorage.getItem("dapp_particle_chain_key") || "Ethereum";
    const chain = ParticleChains[chainKey];
    const particle = new ParticleNetwork({
      projectId: process.env.REACT_APP_PROJECT_ID,
      clientKey: process.env.REACT_APP_CLIENT_KEY,
      appId: process.env.REACT_APP_APP_ID,
      chainName: chain?.name,
      chainId: chain?.id,
      securityAccount: {
        promptSettingWhenSign: promptSettingWhenSign,
        promptMasterPasswordSettingWhenLogin: promptMasterPasswordSettingWhenLogin,
      },
      wallet: {
        displayWalletEntry: walletEntrance,
        uiMode: walletTheme,
        defaultWalletEntryPosition: WalletEntryPosition.BR,
        customStyle: customStyle ? JSON.parse(customStyle) : undefined,
      },
    });
    particle.setAuthTheme({
      uiMode: theme,
      modalBorderRadius,
    });
    particle.setLanguage(language);

    particle.setFiatCoin(fiatCoin || "USD");

    particle.auth.on("chainChanged", chainChanged);
    particle.auth.on("disconnect", disconnect);

    setLoginState(particle && particle.auth.isLogin());
    if (particle && particle.auth.isLogin()) {
      particle.auth
        .getUserSimpleInfo()
        .catch((error) => {
          if (error.code === 10005 || error.code === 8005) {
            logout();
          }
        })
        .finally(() => {
          setUpdateHasPassword(updateHasPassword + 1);
        });
    }
    const particleProvider = new ParticleProvider(particle.auth);
    window.web3 = new Web3(particleProvider);
    return particle;
  }, [
    demoSetting.promptSettingWhenSign,
    demoSetting.promptMasterPasswordSettingWhenLogin,
    demoSetting.customStyle,
    demoSetting.walletEntrance,
    demoSetting.walletTheme,
    demoSetting.theme,
    demoSetting.fiatCoin,
  ]);

  const [updateHasPassword, setUpdateHasPassword] = useState(1);
  const hasPasswordDot = useMemo(() => {
    try {
      if (particle && loginState && updateHasPassword) {
        // @ts-ignore
        const has_set_payment_password = particle.auth.userInfo().security_account?.has_set_payment_password;
        // @ts-ignore
        const has_set_master_password = particle.auth.userInfo().security_account?.has_set_master_password;

        return has_set_payment_password && has_set_master_password;
      }
    } catch (error) {
      return false;
    }
    return false;
  }, [particle, loginState, updateHasPassword]);
  const isTron = () => {
    return particle && particle?.auth?.chain()?.name?.toLowerCase() === "tron";
  };
  const isSolana = () => {
    return particle && particle?.auth?.chain()?.name?.toLowerCase() === "solana";
  };

  const solanaWallet = useMemo(() => {
    return new SolanaWallet(particle.auth);
  }, [particle]);

  const initAccount = () => {
    if (particle.auth.isLogin()) {
      getAccounts();
      getBalance();
    }
  };

  const logout = () => {
    setLogoutLoading(true);
    particle.auth
      .logout(true)
      .then(() => {
        console.log("logout success");
        setBalance(0);
        setLoginState(false);
      })
      .catch((err) => {
        console.log("logout error", err);
      })
      .finally(() => {
        setLogoutLoading(false);
      });
  };

  const connectWallet = (type) => {
    if (loginLoading) return;
    let input_content;
    if (type === "email") {
      const regularExpression =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      input_content = loginAccount && regularExpression.test(loginAccount.toLowerCase()) ? loginAccount : undefined;
    } else if (type === "phone") {
      const regularExpression = /^\+?\d{8,14}$/;
      input_content = loginAccount && regularExpression.test(loginAccount.toLowerCase()) ? loginAccount : undefined;
    } else if (type === "jwt") {
      input_content = loginAccount ? loginAccount.trim() : undefined;
      if (!input_content) {
        setLoginLoading(false);
        return console.log("JWT can not empty!");
      } else {
        console.log("custom loading...");
      }
    }
    setLoginLoading(true);
    particle.auth
      .login({
        preferredAuthType: type,
        account: input_content,
        supportAuthTypes: "all",
        socialLoginPrompt: "consent",
        loginFormMode: demoSetting.loginFormMode === "true",
        hideLoading: type === "jwt",
      })
      .then((userInfo) => {
        window.localStorage.setItem("isPersonalSign", "0");
        setLoginState(true);
        setLoginLoading(false);
      })
      .catch((error) => {
        setLoginLoading(false);
        console.log("connect wallet", error);
        if (error.code !== 4011) {
          console.log(error.message);
        }
      });
  };

  const getBalance = async () => {
    setBalance(0);
    if (isSolana()) {
      solanaWallet
        .getConnection()
        .getBalance(solanaWallet.publicKey)
        .then((result) => {
          setBalance((result / 1000000000).toFixed(4));
        });
      return void 0;
    }
    const accounts = await window.web3.eth.getAccounts();
    window.web3.eth.getBalance(accounts[0]).then((value) => {
      setBalance(isTron() ? fromSunFormat(value) : window.web3.utils.fromWei(value, "ether"));
    });
  };

  const getAccounts = () => {
    if (isSolana()) {
      setAddress(solanaWallet.publicKey?.toBase58() || "");
      return void 0;
    }
    window.web3.eth.getAccounts((error, accounts) => {
      if (error) throw error;
      const account = accounts[0];
      if (isTron()) {
        setAddress(toBase58Address(account));
      } else {
        setAddress(account);
      }
    });
  };
  const getAddr = () => {
    if (address) {
      return address.substring(0, 5) + "..." + address.substring(address.length - 5, address.length);
    }
    return "";
  };

  const ConnectButtonFC = () => {
    if (loginState) {
      const items = [
        {
          key: "1",
          label: (
            <div
              style={{
                height: "40px",
                lineHeight: "40px",
              }}
              onClick={() => {
                navigator.clipboard.writeText(address);
                console.log("Copied to clipboard");
              }}
            >
              Copy Address
            </div>
          ),
        },
        {
          key: "2",
          label: (
            <div
              style={{
                color: "#ff4d4f",
                fontWeight: "bold",
                height: "40px",
                lineHeight: "40px",
              }}
              onClick={logout}
            >
              Disconnect
            </div>
          ),
        },
      ];

      return (
        <div className="header-info">
          <div className="address-info">
            <span>{getAddr()}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="header-info">
        <button type="button" className="btn btn-connect" loading={loginLoading} onClick={() => connectWallet("email")}>
          Auth
        </button>
      </div>
    );
  };

  return (
    <div className="container-fluid navx">
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="container-fluid">
          <a className="navbar-brand text-white" href="/#">
            <img className="img1a img-fluid" src={meta} alt="Metabnb-nav" />
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse nav-float" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item px-3">
                <Link to="/" className="nav-link active text-dark fs-font" aria-current="page">
                  Home
                </Link>
              </li>
              <li className="nav-item px-3">
                <Link to="/" className="nav-link fs-font text-dark">
                  Place to stay
                </Link>
              </li>

              <li className="nav-item px-3 signup2">
                <a href="/nft" className="nav-link fs-font text-dark">
                  NFTs
                </a>
              </li>

              <li className="nav-item px-3">
                <Link to="/" className="nav-link text-dark">
                  Community
                </Link>
              </li>

              <li className="nav-item px-3">
                <Link to="/mint" className="nav-link text-dark">
                  Mint
                </Link>
              </li>

              <li className="nav-item  btn-conx">
                {/* <!-- Button trigger modal */}

                {/* <button type="button" class="btn btn-connect" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                  Connect wallet
                </button>
                <Connect /> */}
                <ConnectButton />
              </li>
              <li className="nav-item px-3">
                <ConnectButtonFC />
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
