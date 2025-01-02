import React from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import { SvgIcon } from "./SvgIcon";
import {useTheme} from "@mui/material";
import {useSnackbar} from 'notistack';
import {useTranslation} from "react-i18next";
import {CustomizedBtn} from "./CustomizedBtn";

function EffectsTab({ setVirtualBackgroundImage, handleBackgroundReplacement }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const [customVirtualBackgroundImages, setCustomVirtualBackgroundImages] = React.useState([]);
  const [backgroundImagesButtonList, setBackgroundImagesButtonList] = React.useState([]);

  React.useEffect(() => {
    updateCustomVirtualBackgroundImages().then(() => {
      //console.log("Custom virtual background images initialized");
    });
  }, []); // eslint-disable-line

  React.useEffect(() => {
    getBackgroundImages();
  }, [customVirtualBackgroundImages]); // eslint-disable-line

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (typeof selectedFile !== 'undefined' && selectedFile !== null) {
      navigator.storage.getDirectory().then((directoryHandle) => {
        saveImageToFileSystem(selectedFile, directoryHandle).then(() => {
          console.log("Image saved to file system");
        });
      });
    }
  };

  function getVirtualBackgroundButton(imageSrc, imageName, i, showRemoveButton = false) {
    return (
      <Grid item key={i}>
        <CustomizedBtn
          style={{
            background: theme.palette.themeColor?.[60],
            marginRight: 10,
            marginBottom: 10,
            position: 'relative'
          }}
          id="custom-virtual-background-button"
          data-testid="custom-virtual-background-button"
          onClick={(e) => {
            setVirtualBackgroundImage(imageSrc);
          }}
        >
          <img
            width={40}
            height={40}
            src={imageSrc}
            alt={"virtual background image " + i}
            loading="lazy"
          ></img>
          {
            showRemoveButton === true ?
              <button
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  fontSize: 'small', // Make the 'x' icon small
                  padding: '2px', // Add some padding
                  borderRadius: '50%', // Make the button round
                  backgroundColor: '#f00', // Make the button red
                  color: 'theme.palette.textColor', // Make the 'x' icon white
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the parent button's onClick from firing
                  removeCustomVirtualBackgroundImage(imageName).then(r => {
                    enqueueSnackbar(t("Virtual background image removed"), {variant: "success"});
                  });
                }}
              >
                &#x2715; {/* HTML entity for 'x' */}
              </button>
            : null
          }
        </CustomizedBtn>
      </Grid>
    );
  }

  const getBackgroundImages = ()  => {
    let virtualBackgroundImageData = [];

    if (process.env.REACT_APP_VIRTUAL_BACKGROUND_IMAGES !== undefined && process.env.REACT_APP_VIRTUAL_BACKGROUND_IMAGES !== null) {
      virtualBackgroundImageData = process.env.REACT_APP_VIRTUAL_BACKGROUND_IMAGES.split(',');
    }

    const images = [];
    let imageIndex = 0;
    for (let i = 0; i < virtualBackgroundImageData.length; i++) {
      images.push(
        getVirtualBackgroundButton(virtualBackgroundImageData[i], "image"+imageIndex, imageIndex, false)
      );
      ++imageIndex;
    }

    for(let customVirtualBackgroundImage of customVirtualBackgroundImages) {
      images.push(
        getVirtualBackgroundButton(customVirtualBackgroundImage.url, customVirtualBackgroundImage.name, imageIndex, false)
      );
      ++imageIndex;
    }

    setBackgroundImagesButtonList(images);
    return images;
  };

  async function saveImageToFileSystem(file, directoryHandle) {
    try {
      const opfsRoot = await navigator.storage.getDirectory();
      const fileHandle = await opfsRoot.getFileHandle(file.name, { create: true });

      // save file name to local storage as list of files
      let files = localStorage.getItem("customVirtualBackgroundImages");
      if (files === null) {
        files = [];
      } else {
        files = JSON.parse(files);
      }
      files.push(file.name);
      localStorage.setItem("customVirtualBackgroundImages", JSON.stringify(files));

      const accessHandle = await fileHandle.createWritable();
      await accessHandle.write(file);
      await accessHandle.close();
      console.log('File saved successfully.');
      await updateCustomVirtualBackgroundImages();
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }

  async function updateCustomVirtualBackgroundImages() {
    const imageFileList = await listFiles();
    if (imageFileList.length > 0) {
      setCustomVirtualBackgroundImages(imageFileList);
    }
  }

  async function removeCustomVirtualBackgroundImage(fileName) {
    try {
      const opfsRoot = await navigator.storage.getDirectory();

      await opfsRoot.removeEntry(fileName);

      let filesFromLocalStorage = localStorage.getItem("customVirtualBackgroundImages");

      if (filesFromLocalStorage !== null) {
        filesFromLocalStorage = JSON.parse(filesFromLocalStorage);
        filesFromLocalStorage = filesFromLocalStorage.filter(item => item !== fileName);
        localStorage.setItem("customVirtualBackgroundImages", JSON.stringify(filesFromLocalStorage));
      }

      console.log('File ' + fileName + ' removed successfully.');
      await updateCustomVirtualBackgroundImages();
    } catch (error) {
      console.error('Error removing file:', error);
    }
  }

  async function listFiles() {
    let files = [];

    const opfsRoot = await navigator.storage.getDirectory();

    // get list of files from local storage
    let filesFromLocalStorage = localStorage.getItem("customVirtualBackgroundImages");
    if (filesFromLocalStorage === null) {
      filesFromLocalStorage = [];
    } else {
      filesFromLocalStorage = JSON.parse(filesFromLocalStorage);
    }

    for await (const entry of opfsRoot.values()) {
      if (entry.kind === "file" && filesFromLocalStorage.includes(entry.name)) {
        const fileHandle = await opfsRoot.getFileHandle(entry.name, { create: false });
        const accessHandle = await fileHandle.getFile();
        const buffer = await accessHandle.arrayBuffer();
        const blob = new Blob([buffer], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);

        let foundedImage = {
          name: entry.name,
          url: url
        };
        files.push(foundedImage);
      }
    }

    return files;
  }

  return (
        <div style={{width: "100%", overflowY: "auto"}}>
          <Stack sx={{width: "100%",}} spacing={2}>
            <Grid container>
              <p>No effect & blur</p>
            </Grid>
            <Grid container>
              <CustomizedBtn
                style={{background: theme.palette.themeColor?.[60], marginRight: 10}}
                id="remove-effect-button" data-testid="remove-effect-button" onClick={(e) => {
                handleBackgroundReplacement("none");
              }}>
                <SvgIcon size={40} name={'remove-effect'} color="#fff"/>
              </CustomizedBtn>
              <CustomizedBtn
                style={{background: theme.palette.themeColor?.[60], marginRight: 10}}
                id="slight-blur-button" data-testid="slight-blur-button" onClick={(e) => {
                handleBackgroundReplacement("slight-blur");
              }}>
                <SvgIcon size={40} name={'slight-blur'} color="#fff"/>
              </CustomizedBtn>
              <CustomizedBtn
                style={{background: theme.palette.themeColor?.[60], marginRight: 10}}
                id="blur-button" data-testid="blur-button" onClick={(e) => {
                handleBackgroundReplacement("blur");
              }}>
                <SvgIcon size={40} name={'blur'} color="#fff"/>
              </CustomizedBtn>
            </Grid>
            <Grid container>
              <p>Backgrounds</p>
            </Grid>
            <input type="file" accept=".jpg, .jpeg, .png" style={{display: "none"}} onChange={handleFileChange} id="imageInput"/>
            <Grid container>
              <Grid item key={"add-background-image"}>
                <CustomizedBtn
                  style={{
                    background: theme.palette.themeColor?.[60],
                    marginRight: 10,
                    marginBottom: 10,
                    width: 40,
                    height: 60
                  }}
                  id="upload-background-image-button" onClick={(e) => {
                  document.getElementById("imageInput").click();
                }}>
                  <SvgIcon size={40} name={'add-background-image'} color="#fff"/>
                </CustomizedBtn>
              </Grid>
                {backgroundImagesButtonList}
            </Grid>
          </Stack>
        </div>
  );

}

export default EffectsTab;
