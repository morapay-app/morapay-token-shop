import type { ComponentType } from "react";
import type { HomeLayoutVariant } from "@/config/themes";
import { CultureHome } from "./CultureHome";
import { DefaultHome } from "./DefaultHome";
import { PiHome } from "./PiHome";
import { SimpleTokenHome } from "./SimpleTokenHome";
import type { HomeProps } from "./types";
import { WikiCatHome } from "./WikiCatHome";

export const HOMES: Record<HomeLayoutVariant, ComponentType<HomeProps>> = {
  default: DefaultHome,
  culture: CultureHome,
  wikicat: WikiCatHome,
  simple: SimpleTokenHome,
  pi: PiHome,
};
