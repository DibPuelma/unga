import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import Script from "next/script";
import { Button } from "@mui/material";
import AssetShowcase from "../assets/AssetShowcase";

export default forwardRef((
  {
    buttonIcon,
    onAssetChange,
    buttonTitle,
    buttonSx = {},
    withoutShowcase,
    withoutButton,
    fullWidth = false,
    multiple = true,
    assets: propsAssets,
    allowedFormats = null,
    id = "upload_widget",
  },
  ref
) => {
  const [assets, setAssets] = useState(propsAssets || {});
  // Already loaded by another widget instance on this page, e.g. via client-side navigation.
  const [widgetScriptLoaded, setWidgetScriptLoaded] = useState(
    () => typeof window !== 'undefined' && !!window.cloudinary
  );

  useEffect(() => {
    if (!widgetScriptLoaded) return;

    const options = {
      multiple,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      sources: ['local', 'url', 'camera', 'dropbox', 'google_drive'],
    };

    if (allowedFormats) options.clientAllowedFormats = allowedFormats;
    var myWidget = window.cloudinary.createUploadWidget(
      options,
      (error, result) => {
        if (!error && result && result.event === "success") {
          const { info: asset } = result;
          setAssets((oldAssets) => {
            const newAssets =  { ...oldAssets, [asset.asset_id]: asset };
            onAssetChange(newAssets);
            return newAssets;
          })
        }
      }
    );
    const element = document.getElementById(id);

    const openWidget = () => myWidget.open();
    element?.addEventListener('click', openWidget);
    return () => {
      element?.removeEventListener('click', openWidget);
    }
  }, [widgetScriptLoaded])

  useImperativeHandle(ref, () => ({
    clearAssets: () => setAssets({}),
  }), []);

  const handleRemoveImage = (assetId) => {
    const newAssets = { ...assets }
    delete newAssets[assetId]
    setAssets(newAssets);
    onAssetChange?.(newAssets);
  };

  return (
    <>
      <Script
        src="https://widget.cloudinary.com/v2.0/global/all.js"
        strategy="lazyOnload"
        onLoad={() => setWidgetScriptLoaded(true)}
      />
      {!withoutShowcase && (
        <AssetShowcase assets={assets} handleRemoveImage={handleRemoveImage} />
      )}
      {!withoutButton && (
        <Button id={id} variant="outlined" startIcon={buttonIcon} fullWidth={fullWidth} sx={buttonSx}>
          {buttonTitle}
        </Button>
      )}
    </>
  );
})
