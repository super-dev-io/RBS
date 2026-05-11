export type BlockKind =
  | "header"
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications";

export type BlockAlignment = "left" | "center" | "right" | "justify";

export interface BlockHeadingStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  uppercase?: boolean;
}

export interface BlockStyle {
  fontSize?: number;
  textColor?: string;
  alignment?: BlockAlignment;
  headingStyle?: BlockHeadingStyle;
}

export interface BlockConfig {
  kind: BlockKind;
  enabled: boolean;
  order: number;
  style?: BlockStyle;
}

export type FontFamily = "Inter" | "Lora" | "Source Sans" | "Playfair";
export type Density = "compact" | "normal" | "relaxed";
export type Layout = "one-col" | "two-col";

export interface ThemeConfig {
  fontFamily: FontFamily;
  accentColor: string;
  baseFontSize: number;
  density: Density;
  layout: Layout;
  timeline?: boolean;
}

export interface TemplateConfig {
  blocks: BlockConfig[];
  theme: ThemeConfig;
}

export const ALL_BLOCK_KINDS: BlockKind[] = [
  "header",
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
];

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  blocks: ALL_BLOCK_KINDS.map((kind, i) => ({ kind, enabled: true, order: i })),
  theme: {
    fontFamily: "Inter",
    accentColor: "#2563eb",
    baseFontSize: 11,
    density: "normal",
    layout: "one-col",
  },
};
