export const SITE = {
  website: "https://blog.huizhi.ink/",
  author: "huizhiLLL",
  profile: "https://github.com/huizhiLLL",
  desc: "也许只是一些碎碎念吧。",
  title: "huizhi's Aside",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "Edit page",
    url: "https://github.com/huizhiLLL/AstroPaper/edit/main/",
  },
  comments: {
    enabled: true,
    repo: "huizhiLLL/Astro-Paper",
    repoId: "R_kgDOSa4XIQ",
    category: "Announcements",
    categoryId: "DIC_kwDOSa4XIc4C84CW",
    mapping: "pathname",
    strict: "0",
    reactionsEnabled: "1",
    emitMetadata: "0",
    inputPosition: "bottom",
    lang: "zh-CN",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "zh-CN", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Shanghai", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
