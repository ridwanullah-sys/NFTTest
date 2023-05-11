import { useState, useRef } from "react";
import Footer from "../component/Footer";
import Navbar from "../component/Navbar";
import { NFTAddress } from "../config";
import "../component/navbar.css";
import { toast } from "react-toastify";
import { Button, Container, Stack, TextField, Typography, Card, Box, IconButton } from "@mui/material";
import { Close, Send, Image } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { useFormik } from "formik";
import * as Yup from "yup";
import { create } from "ipfs-http-client";

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
    onSubmit: async (values, helpers, { resetForm }) => {
      try {
        await mintNFT();
        resetForm();
      } catch (err) {
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: err.message });
        helpers.setSubmitting(false);
      }
    },
  });

  const ipfs = create({
    url: "https://ipfs.infura.io:5001/api/v0",
    headers: {
      authorization,
    },
  });

  const handleFileSelect = (e) => {
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
    if (file) {
      try {
        // upload files
        const result = await ipfs.add(file);

        setFileInfo([
          file,
          {
            cid: result.cid,
            path: result.path,
          },
        ]);
      } catch (e) {
        console.log(e);
        toast.error(e.message);
      }
    }
    setLoading(false);
  };

  const handleResetFile = (e) => {
    e.stopPropagation();
    setFileUrl(null);
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
        file: fileInfo[1].path,
      };
      const result = await ipfs.add(new Blob([JSON.stringify(object)]));
      path = result.path;
    } catch (e) {
      console.log(e);
      toast.error("Uplaod asset file first");
    }

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
      methodCall.call(this, accounts[0], path).send(
        {
          from: accounts[0],
          gas: 300000,
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
                error={!!(formik.touched.description && formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
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
                      sx={fileUrl ? { position: "absolute", right: "1vw", top: "1vh" } : { display: "none" }}
                    >
                      <Close color="white" />
                    </IconButton>
                  </div>
                  <img
                    src={fileUrl}
                    alt=""
                    style={fileUrl ? { objectFit: "cover", height: "100%", overflow: "hidden" } : { display: "none" }}
                  />
                  <Image fontSize="large" sx={fileUrl ? { display: "none" } : { width: 100, height: 100 }} />
                </Card>
                <Stack sx={{}}>
                  <LoadingButton loading={loading} loadingPosition="start" startIcon={<Send />} onClick={uploadfile}>
                    Upload
                  </LoadingButton>
                </Stack>
              </div>
            </Stack>
            <Stack spacing={2} sx={{ mb: 3 }} direction="row">
              <Button sx={{ padding: 1, width: "35%" }} type="submit" variant="contained">
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
