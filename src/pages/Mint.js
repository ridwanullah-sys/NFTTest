import { useState } from "react";
import Footer from "../component/Footer";
import Navbar from "../component/Navbar";
import { NFTAddress } from "../config";
import "../component/navbar.css";
import { toast } from "react-toastify";

const nft_abi = require("../MyTestNFT.json");

const Mint = () => {
  const [tokenId, setTokenId] = useState();
  const [read, setRead] = useState(false);

  const mintNFT = async () => {
    const accounts = await window.web3.eth.getAccounts();
    window.web3.eth.Contract.setProvider(window.web3.currentProvider, accounts);

    var contract = new window.web3.eth.Contract(nft_abi.abi, NFTAddress);

    const methodCall = contract.methods["safeMint"];
    if (read) {
      methodCall()
        .call()
        .then((result) => {
          toast.success({
            message: "Read Contract Success",
            description: result,
          });
        })
        .catch((error) => {
          toast.error(error.message || "Read Contract Error");
        });
    } else {
      //@ts-ignore
      methodCall.call(this, accounts[0]).send(
        {
          from: accounts[0],
          gas: 23000,
        },
        (error, hash) => {
          if (error) {
            if (error.code !== 4011) {
              toast.error(error.message);
            }
          } else {
            toast.success({
              message: "Contract Call Success",
              description: hash,
            });
          }
        }
      );
    }
  };

  return (
    <div className="container-fluid">
      <Navbar />
      <div style={{ display: "flex", alignItems: "cneter", justifyContent: "center", height: "550px" }}>
        <button className="btn btn-connect" onClick={() => mintNFT()}>
          Mint
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default Mint;
