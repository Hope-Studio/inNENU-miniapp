import $register = require("wxpage");

import { getImagePrefix, getTitle } from "../../utils/config";
import { popNotice, resolvePage, setPage } from "../../utils/page";

import type { AppOption } from "../../app";
import type { PageData } from "../../../typings";

const { globalData } = getApp<AppOption>();
const { appID, env, version } = globalData;

$register("me", {
  data: {
    theme: globalData.theme,

    /** 自定义导航栏配置 */
    nav: {
      title: "我的东师",
      action: false,
      grey: true,
      statusBarHeight: globalData.info.statusBarHeight,
    },
    page: {
      title: "我的东师",
      grey: true,
      hidden: true,
      content: [
        {
          tag: "list",
          header: false,
          content: [
            {
              text: "外观设置",
              icon: "setting",
              url: "outlook",
            },
            {
              text: "权限设置",
              icon: "setting",
              url: "auth",
            },
            {
              text: "存储设置",
              icon: "setting",
              url: "storage",
            },
            {
              text: "更新日志",
              icon: "log",
              url: "log",
              desc: version,
            },
            {
              text: "关于",
              icon: "about",
              url: "about",
            },
          ],
        },
        {
          tag: "advanced-list",
          content: [
            {
              text: "分享小程序",
              icon: "share",
              type: "button",
              openType: "share",
            },
            {
              hidden: env === "qq",
              text: "Bug 反馈",
              icon: "bug",
              type: "button",
              openType: "feedback",
            },
            {
              hidden: env === "wx",
              text: "加入 in 东师咨询群",
              icon: "qq-group",
              type: "button",
              openType: "openGroupProfile",
              groupId: "1139044856",
            },
            {
              hidden: env === "wx",
              text: "添加 Mr.Hope 好友",
              icon: "qq",
              type: "button",
              openType: "addFriend",
              openId: "868D7B2F0C609B4285698EAB77A47BA1",
            },
            {
              hidden: env === "qq",
              text:
                appID === "wx9ce37d9662499df3" ? "联系校会君" : "联系 Mr.Hope",
              icon: "contact",
              type: "button",
              openType: "contact",
            },
            {
              hidden: env === "wx",
              text: "添加到桌面",
              icon: "send",
              type: "button",
              handler: "addToDesktop",
            },
          ],
        },
      ],
    } as PageData,

    footer: {
      author: "",
      desc: `当前版本: ${version}\n${
        appID === "wx9ce37d9662499df3"
          ? "Mr.Hope 已授权东北师范大学校学生会使用小程序代码。\n"
          : ""
      }小程序由 Mr.Hope 个人制作，如有错误还请见谅`,
    },
  },

  onPreload(res) {
    this.$put("me", resolvePage(res, this.data.page));
    console.info(
      `User page load time: ${new Date().getTime() - globalData.date}ms`
    );
  },

  onLoad() {
    setPage({ option: { id: "me" }, ctx: this }, this.$take("me"));
    popNotice("me");
  },

  onReady() {
    // 注册事件监听器
    this.$on("theme", (theme: string) => {
      this.setData({ theme });
    });

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.onThemeChange);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: getTitle(),
    path: "/pages/main/main",
    imageUrl: `${getImagePrefix()}Share.jpg`,
  }),

  onShareTimeline: () => ({ title: getTitle() }),

  onAddToFavorites: () => ({
    title: getTitle(),
    imageUrl: `${getImagePrefix()}.jpg`,
  }),

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.onThemeChange);
  },

  onThemeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  addToDesktop() {
    wx.saveAppToDesktop({
      success: () => {
        console.log("Add to desktop success!");
      },
    });
  },
});
