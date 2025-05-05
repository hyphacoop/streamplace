// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  base: "/docs",
  integrations: [
    starlight({
      title: "Streamplace Docs",
      customCss: [
        "@fontsource/atkinson-hyperlegible-next/400.css",
        "@fontsource/atkinson-hyperlegible-next/600.css",
        "./src/styles/custom-font-face.css",
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/streamplace/streamplace",
        },
      ],
      logo: {
        src: "/src/assets/cube.png",
        alt: "Streamplace Logo",
      },
      sidebar: [
        {
          label: "Guides",
          items: [
            {
              label: "Start Streaming",
              autogenerate: { directory: "guides/start-streaming" },
            },
            {
              label: "Start Contributing",
              autogenerate: { directory: "guides/start-contributing" },
            },
          ],
        },
        // {
        //   label: "Reference",
        //   autogenerate: { directory: "reference" },
        // },
        {
          label: "Lexicon Reference",
          autogenerate: { directory: "lex-reference" },
        },
      ],
    }),
  ],
});
