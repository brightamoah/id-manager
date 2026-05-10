export default defineAppConfig({
  ui: {
    colors: {
      primary: "turso",
      neutral: "neutral",
    },
    icons: {
      loading: "i-lucide-loader",
    },
    pageSection: {
      slots: {
        container: "py-8 sm:py-12 lg:py-14",
        title: "text-2xl md:text-3xl lg:text-4xl",
      },
    },
  },
  theme: {
    radius: 0.25,
    blackAsPrimary: false,
  },
});
