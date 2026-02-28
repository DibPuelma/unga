import React, { useState } from 'react';
import Image from 'next/image';
import ReactPlayer from 'react-player/file'
import { Close, Download, InsertDriveFile, PictureAsPdf, VideoFile } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, Grid, IconButton, Stack, Typography } from '@mui/material';

import imageStyles from '../../styles/images.module.css'
import axios from 'axios';

export default function AssetShowcase({ assets, thumbnails, handleRemoveImage, withDownload }) {
  const [selectedAsset, setSelectedAsset] = useState(null);

  const handleClearSelectedAsset = () => setSelectedAsset(null);

  const handleSelectAsset = (i) => {
    setSelectedAsset(assets[i]);
  }

  const handlePreviousAsset = () => {
    let newSelectedAsset = selectedAsset - 1;
    if (newSelectedAsset < 0) newSelectedAsset = assets.length - 1;
    setSelectedAsset(newSelectedAsset);
  }

  const handleNextAsset = () => {
    let newSelectedAsset = (selectedAsset + 1) % assets.length;
    setSelectedAsset(newSelectedAsset)
  }

  const handleDownload = (asset) => {
    axios({
      url: asset.secure_url,
      method: 'GET',
      responseType: 'blob'
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${asset.original_filename}.${asset.format}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
  }

  const height = thumbnails ? 50 : 200;
  const width = thumbnails ? 40 : 120;

  const AssetStack = ({ asset, i }) => {
    const splittedId = asset.path.split('.')
    const fileType = splittedId[splittedId.length - 1];
    const fileName = `${asset.original_filename}.${fileType}`;
    return (
      <Stack key={asset.asset_id} justifyContent="space-between">
        <Stack
          onClick={() => handleSelectAsset(i)}
          alignItems="center"
          minWidth={thumbnails ? 0 : 200}
        >
          {asset.resource_type === 'video' && (
            <VideoFile sx={{ width, height }} color="primary" />
          )}
          {asset.resource_type === 'image' && asset.format !== 'pdf' && (
            <Image
              src={thumbnails ? asset.thumbnail_url : asset.secure_url}
              width={parseInt(height * asset.width / asset.height, 10)}
              height={height}
              alt="Uploaded image"
              className={imageStyles.borderRadius}
            />
          )}
          {asset.format === 'pdf' && (
            <>
              <PictureAsPdf fontSize='large' />
              <Typography textAlign="center">{fileName}</Typography>
            </>
          )}
          {asset.resource_type === 'raw' && (
            <>
              <InsertDriveFile fontSize='large' />
              <Typography textAlign="center">{fileName}</Typography>
            </>
          )}
        </Stack>
        {!thumbnails && (
          <Box>
            <Button
              color="error"
              variant="text"
              startIcon={<Close />}
              fullWidth
              onClick={() => handleRemoveImage(asset.asset_id)}
            >
              Eliminar
            </Button>
          </Box>
        )}
        {withDownload && (
          <Box>
            <Button
              variant="text"
              startIcon={<Download />}
              fullWidth
              onClick={() => handleDownload(asset)}
            >
              Descargar
            </Button>
          </Box>
        )}
      </Stack>
    );
  }

  const AssetDialog = () => (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={
        selectedAsset !== null
        && (selectedAsset.resource_type === 'video' || selectedAsset.resource_type === 'image')
      }
      onClose={handleClearSelectedAsset}
    >
      <Box display="flex" justifyContent="end">
        <IconButton
          onClick={handleClearSelectedAsset}
          size="large"
          color="error"
          sx={{ backgroundColor: 'white', margin: '1rem', padding: '0.5rem', zIndex: 100 }}
        >
          <Close fontSize="large" />
        </IconButton>
      </Box>
      <DialogContent sx={{ height: "80vh" }}>
        <Box width='100%' height="90%">
          {selectedAsset?.resource_type === 'image' && (
            <Image
              objectFit="contain"
              layout="fill"
              src={selectedAsset?.secure_url}
            />
          )}
          {selectedAsset?.resource_type === 'video' && (
            <ReactPlayer
              width="100%"
              height="100%"
              url={selectedAsset?.secure_url}
              controls
            />
          )}
        </Box>
      </DialogContent>
      {assets.width > 0 && (
        <DialogActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="contained" onClick={handlePreviousAsset}>Anterior</Button>
          <Button variant="contained" onClick={handleNextAsset}>Siguiente</Button>
        </DialogActions>
      )}
    </Dialog>
  )

  if (thumbnails) {
    return (
      <Stack
        width="100%"
        sx={{ overflowX: 'scroll' }}
        direction="row"
        alignItems="flex-end"
        spacing={2}
      >
        {Object.entries(assets).map(([key, asset], i) => (
          <AssetStack asset={asset} i={i} key={key} />
        ))}
        <AssetDialog />
      </Stack>
    )
  }

  return (
    <Stack
      direction="row"
      maxWidth="100%"
      overflow="scroll"
      spacing={2}
    >
      {Object.entries(assets).map(([key, asset], i) => (
        <AssetStack asset={asset} i={i} key={key} />
      ))}
      <AssetDialog />
    </Stack>
  );
};