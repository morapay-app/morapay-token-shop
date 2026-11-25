import { ImageResponse } from "next/og";
import { DefaultOgImage } from "@/components/og/DefaultOgImage";
import { PiOgImage } from "@/components/og/PiOgImage";
import { XrpOgImage } from "@/components/og/XrpOgImage";
import { shopConfig } from "@/shop.config";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const DESIGNS = { xrp: XrpOgImage, pi: PiOgImage };

export default function OgImage() {
  const design = shopConfig.brand.ogImage;
  const Design = design ? DESIGNS[design] : DefaultOgImage;
  return new ImageResponse(<Design />, { ...size });
}
