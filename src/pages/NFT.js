import "../Assets/style/NFT.css";
import Footer from "../component/Footer";
import Navbar from "../component/Navbar";
import { NFTAddress } from "../config";
import nft_abi from "../MyTestNFT.json";

// nft images

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";

const NFT = () => {
  const [images, setImages] = useState([]);
  const [loading, setIsLoading] = useState();
  const callTest = async () => {
    setIsLoading(true);
    try {
      const array = [];
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.REACT_APP_ALCHEMY_RPC_URL
      );
      const contract = new ethers.Contract(NFTAddress, nft_abi.abi, provider);
      const numberOfNftMinted = await contract.numberOfNftMinted();

      if (numberOfNftMinted < 1) {
        setImages([]);
      } else {
        const promise = new Promise(async (resolve, reject) => {
          for (let index = 0; index < numberOfNftMinted; index++) {
            const urI = await contract.tokenURI(index);
            const response = await fetch(urI);
            const tokenInfo = await response.json();
            array.push(tokenInfo.file);
            if (index == numberOfNftMinted - 1) {
              resolve(index);
            }
          }
        });
        await promise;
        setImages(array);
      }
    } catch (e) {
      toast.error(e.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    callTest();
  }, []);

  return (
    <div classname="container-fluid">
      <Navbar />
      <div className="conx1">
        <p>Resturant</p>
        <p>cottage</p>
        <p>Castle</p>
        <p>fantasy city</p>
        <p>Beach</p>
        <p>cabins</p>
        <p>Off-grid</p>
        <p>Farm</p>
        {/* <p>Resturant</p> */}
        <button type="submit" class="location-btn">
          Location <img src="../images/btn.png" alt="setting" />
        </button>
      </div>
      <div className="NFTList">
        {loading ? (
          <div>Loading</div>
        ) : images.length > 0 ? (
          images.map((image) => {
            return (
              <div className="conx2">
                <img className="mbx" src={image} alt="frame1" />
              </div>
            );
          })
        ) : (
          <div>No NFT minted</div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default NFT;
