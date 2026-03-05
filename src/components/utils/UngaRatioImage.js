import { Box } from "@mui/material";
import NextImage from "next/image";

export default function UngaRatioImage({ image, baseHeight = 75, onFinishRender, borderRadius, priority, alt='Decorative image' }) {
  if (!image) return null;

  const src = typeof image === 'string' ? image : image.secure_url || image.url;
  if (!src) return null;

  const width = typeof image === 'object' ? Number(image.width) : baseHeight;
  const height = typeof image === 'object' ? Number(image.height) : baseHeight;
  const forcedWidth = width > 0 && height > 0 ? (width * baseHeight) / height : baseHeight;

  const handleLoadingComplete = () => {
    if (onFinishRender) onFinishRender();
  }

  const Image = <img
    src={src}
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