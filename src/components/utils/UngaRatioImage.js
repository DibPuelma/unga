import { Box } from "@mui/material";
import NextImage from "next/image";

export default function UngaRatioImage({ image, baseHeight = 75, onFinishRender, borderRadius, priority, alt='Decorative image' }) {
  if (!image) return null;

  const { width, height, secure_url } = image;
  const forcedWidth = width * baseHeight / height

  const handleLoadingComplete = () => {
    if (onFinishRender) onFinishRender();
  }

  const Image = <img
    src={secure_url}
    width={forcedWidth}
    height={baseHeight}
    alt={alt}
  />

  if (borderRadius) return (
    <Box borderRadius={borderRadius} overflow="hidden" width={forcedWidth} height={baseHeight}>
      {Image}
    </Box>
  );

  return Image;
}