import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = src;
  });
}

/** Crop an image to the given pixel area and return a JPEG File. */
export async function getCroppedImageFile(
  imageSrc: string,
  crop: Area,
  {
    fileName = "cover.jpg",
    mimeType = "image/jpeg",
    quality = 0.92,
    outputWidth,
  }: {
    fileName?: string;
    mimeType?: string;
    quality?: number;
    /** If set, scale the crop to this width (height follows aspect). */
    outputWidth?: number;
  } = {},
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not crop image.");
  }

  const scale =
    outputWidth && crop.width > 0 ? outputWidth / crop.width : 1;
  canvas.width = Math.round(crop.width * scale);
  canvas.height = Math.round(crop.height * scale);

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Could not export cropped image."));
          return;
        }
        resolve(result);
      },
      mimeType,
      quality,
    );
  });

  return new File([blob], fileName, { type: mimeType });
}
