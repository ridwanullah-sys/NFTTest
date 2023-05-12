import { useState, useRef } from "react";
import Footer from "../component/Footer";
import Navbar from "../component/Navbar";
import { NFTAddress } from "../config";
import "../component/navbar.css";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import axios from "axios";
import {
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  Card,
  Box,
  IconButton,
} from "@mui/material";
import { Close, Send, Image } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { useFormik } from "formik";
import * as Yup from "yup";

const projectId = process.env.REACT_APP_INFURA_PROJECT_ID;
const projectSecret = process.env.REACT_APP_INFURA_PROJECT_SECRET;
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);
console.log(authorization);

const nft_abi = require("../MyTestNFT.json");

const Mint = () => {
  const [read, setRead] = useState(false);
  const fileRef = useRef();
  const [fileUrl, setFileUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokenId, setTokenId] = useState(null);
  const [tokenUri, setTokenUri] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const formik = useFormik({
    initialValues: {
      name: "",
      price: "",
      description: "",
      submit: null,
    },
    validationSchema: Yup.object({
      name: Yup.string().max(255).required("Asset Name is required"),
      price: Yup.number().required("Asset price is required"),
      description: Yup.string().max(255).required("Description is required"),
    }),
    onSubmit: async (values, helpers) => {
      try {
        await mintNFT();
        handleResetFile();
      } catch (err) {
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: err.message });
        helpers.setSubmitting(false);
      }
    },
  });

  const handleFileSelect = async (e) => {
    const pickedFile = e.target.files[0];
    const reader = new FileReader();
    if (pickedFile) {
      setFile(pickedFile);
      reader.readAsDataURL(pickedFile);
      reader.onloadend = function (e) {
        setFileUrl(reader.result);
      };
    }
  };

  const uploadfile = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const metadata = JSON.stringify({
      name: "File name",
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);
    const JWT = process.env.REACT_APP_PINATA_JWT;

    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          maxBodyLength: "Infinity",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
            Authorization: `Bearer ${JWT}`,
          },
        }
      );

      setFileInfo(res.data);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
    setLoading(false);
  };

  const handleResetFile = (e) => {
    setFileInfo(null);
    setFile(null);
    fileRef.current.value = null;
  };

  const mintNFT = async () => {
    let path;
    try {
      if (!fileInfo) {
        toast.error("Uplaod asset file first");
        return;
      }
      const object = {
        name: formik.values.name,
        price: formik.values.price,
        description: formik.values.description,
        file: `https://ipfs.io/ipfs/${fileInfo.IpfsHash}`,
      };
      const JWT = process.env.REACT_APP_PINATA_JWT;
      
      var config = {
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT}`,
        },
        data: object,
      };

      const res = await axios(config);
      path = `https://ipfs.io/ipfs/${res.data.IpfsHash}`;
      
    } catch (e) {
      console.log(e);
      toast.error("Uplaod asset file first");
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    const contract = new ethers.Contract(NFTAddress, nft_abi.abi, provider);
    await contract
      .connect(signer)
      .safeMint(address, path)
      .then((result) => {
        toast.success({
          message: "Read Contract Success",
          description: result,
        });
      })
      .catch((error) => {
        toast.error(error.message || "Read Contract Error");
      });
  };

  return (
    <div className="container-fluid">
      <Navbar />
      {/* <div style={{ display: "flex", alignItems: "cneter", justifyContent: "center", height: "550px" }}>
        <button className="btn btn-connect" onClick={() => mintNFT()}>
          Mint
        </button>
      </div> */}
      <Container>
        <Box
          sx={{
            px: 3,
            width: "100%",
          }}
        >
          <form noValidate onSubmit={formik.handleSubmit}>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <TextField
                required
                placeholder="Asset Name"
                name="name"
                label="Asset Name"
                error={!!(formik.touched.name && formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                value={formik.values.name}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              />
            </Stack>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <TextField
                placeholder="Asset Description"
                multiline
                maxRows={4}
                name="description"
                label="Description"
                error={
                  !!(formik.touched.description && formik.errors.description)
                }
                helperText={
                  formik.touched.description && formik.errors.description
                }
                value={formik.values.description}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                sx={{
                  "&.MuiTextField-root": {
                    minHeight: 10,
                  },
                  "& .MuiOutlinedInput-root": {
                    height: 100,
                    alignItems: "start",
                  },
                }}
              />
            </Stack>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <TextField
                required
                placeholder="NFT Price"
                name="price"
                label="Price"
                error={!!(formik.touched.price && formik.errors.price)}
                helperText={formik.touched.price && formik.errors.price}
                value={formik.values.price}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              />
            </Stack>
            {formik.errors.submit && (
              <Typography color="error" sx={{ mt: 3 }} variant="body2">
                {formik.errors.submit}
              </Typography>
            )}
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography variant="h6">Image, Video, Audio</Typography>
              <div style={{ width: "fit-content" }}>
                <input
                  ref={fileRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  id="contained-button-file"
                  multiple
                  type="file"
                  onChange={handleFileSelect}
                />
                <Card
                  sx={{
                    display: "flex",
                    width: 320,
                    height: 240,
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "auto",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      position: "absolute",
                      inset: "0",
                    }}
                    onClick={() => fileRef.current.click()}
                  >
                    <IconButton
                      aria-label="close"
                      onClick={(e) => handleResetFile(e)}
                      sx={
                        fileUrl
                          ? { position: "absolute", right: "1vw", top: "1vh" }
                          : { display: "none" }
                      }
                    >
                      <Close color="white" />
                    </IconButton>
                  </div>
                  <img
                    src={fileUrl}
                    alt=""
                    style={
                      fileUrl
                        ? {
                            objectFit: "cover",
                            height: "100%",
                            overflow: "hidden",
                          }
                        : { display: "none" }
                    }
                  />
                  <Image
                    fontSize="large"
                    sx={
                      fileUrl
                        ? { display: "none" }
                        : { width: 100, height: 100 }
                    }
                  />
                </Card>
                <Stack sx={{}}>
                  <LoadingButton
                    loading={loading}
                    loadingPosition="start"
                    startIcon={<Send />}
                    onClick={uploadfile}
                  >
                    Upload
                  </LoadingButton>
                </Stack>
              </div>
            </Stack>
            <Stack spacing={2} sx={{ mb: 3 }} direction="row">
              <Button
                sx={{ padding: 1, width: "35%" }}
                type="submit"
                variant="contained"
              >
                Mint NFT
              </Button>
            </Stack>
          </form>
        </Box>
      </Container>
      <Footer />
    </div>
  );
};

export default Mint;
