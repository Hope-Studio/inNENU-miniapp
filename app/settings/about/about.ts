/* 关于 */

import $register = require("wxpage");
import { changeNav, popNotice, resolvePage, setPage } from "../../utils/page";
import { requestJSON, tip } from "../../utils/wx";
import { AppOption } from "../../app";
import { server } from "../../utils/config";
import { PageConfig, AdvancedListComponentConfig } from "../../../typings";
const { globalData } = getApp<AppOption>();
let clickNumber = 0;
let developMode = false;

$register("about", {
  data: {
    theme: globalData.theme,
    darkmode: globalData.darkmode,
    page: {
      title: "关于",
      desc: `当前版本: ${globalData.version}`,
      grey: true,
      feedback: true,
      content: [
        {
          tag: "List",
          header: "版本号",
          content: [
            { text: globalData.version, button: "debugMode" },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { text: "启用测试功能", swiKey: "test", Switch: "testSwitch" },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { text: "调试开关", swiKey: "debugMode", Switch: "debugSwitch" },
            { text: "退出开发者模式", button: "debugMode" },
          ],
        },
        {
          tag: "list",
          header: "小程序介绍",
          content: [
            { text: "   小程序全部内容均由Hope Studio独立开发。" },
            {
              text: "Hope Studio 介绍",
              url: "page?path=other/MrHope/hope-studio",
            },
            { text: "Mr.Hope 个人介绍", url: "page?path=other/MrHope/mrhope" },
            { text: "开发者访谈", url: "page?path=other/MrHope/interview" },
            { text: "常见问题", url: "page?path=other/MrHope/function" },
            { text: "致谢名单", url: "page?path=other/MrHope/thanks" },
          ],
        },
        {
          tag: "text",
          heading: "小程序内容",
          style: "text-indent: 1.5em;",
          text: [
            "小程序页面内容仓库在 Github 上开源。如果您愿意对小程序提供帮助，欢迎您点击下方链接为该仓库做贡献。您可以帮助扩充或编辑小程序的页面文字、图片以及相关文件。",
          ],
        },
        {
          tag: "copy",
          text: "https://github.com/Hope-Studio/innenu-res",
        },
        {
          tag: "text",
          heading: "内容版权及使用",
          style: "text-indent: 1.5em;",
          text: [
            "请您特别注意，除标注来源的文字、图片 Mr.Hope 没有版权外，其余文字、图片均放置在 “署名-非商业性使用-禁止演绎 4.0 国际许可证” 下。请您合法使用这些文字与图片，以避免遭到 Mr.Hope 的起诉。",
            "您可以自由地\n· 共享 — 在任何媒介以任何形式复制、发行本作品",
            "惟须遵守下列条件:\n1. 署名: 您必须给出适当的署名，提供指向下方许可协议的链接，同时标明是否（对原始作品）作了修改。您可以用任何合理的方式来署名，但是不得以任何方式暗示许可人为您或您的使用背书。\n2. 非商业性使用: 您不得将本作品用于商业目的\n3. 禁止演绎: 如果您 再混合、转换、或者基于该作品创作，您不可以分发修改作品。\n4. 没有附加限制: 您不得适用法律术语或者 技术措施 从而限制其他人做许可协议允许的事情。",
            "下方是协议详情",
          ],
        },
        {
          tag: "copy",
          text: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
        },
      ],
    },
  },

  onNavigate(res) {
    const { page } = this.data;

    // 读取开发者模式并对页面显示做相应改变
    developMode = wx.getStorageSync("developMode");
    if (!developMode)
      (page.content[0] as AdvancedListComponentConfig).content.forEach(
        (x, y) => {
          x.hidden = y !== 0;
        }
      );

    resolvePage(res, page as PageConfig);
  },

  onLoad(option: any) {
    if (globalData.page.id === "关于") setPage({ option, ctx: this });
    else {
      const { page } = this.data;

      // 读取开发者模式并对页面显示做相应改变
      developMode = wx.getStorageSync("developMode");
      if (!developMode)
        (page.content[0].content as any[]).forEach((x, y) => {
          x.hidden = y !== 0;
        });

      setPage({ option: { id: "about" }, ctx: this }, page as PageConfig);
    }

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);

    popNotice("about");
  },

  onReady() {
    // 读取在线文件更新页面显示
    requestJSON(
      `resource/config/${globalData.appID}/${globalData.version}/about`,
      (data: any) => {
        setPage(
          { option: { id: "关于" }, ctx: this },
          {
            ...this.data.page,
            content: this.data.page.content
              .slice(0, 1)
              .concat(data) as PageConfig["content"],
          }
        );
      }
    );
  },

  onPageScroll(event) {
    changeNav(event, this);
  },

  onShareAppMessage: () => ({
    title: "关于",
    path: "/settings/about/about",
    imageUrl: `${server}img/${
      globalData.appID === "wx9ce37d9662499df3" ? "myNENU" : "inNENU"
    }Share.jpg`,
  }),

  onShareTimeline: () => ({ title: "关于" }),

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  themeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  /** 列表控制函数 */
  list({ detail }: any) {
    if (detail.event)
      this[detail.event as "debugSwitch" | "testSwitch"](detail.value);
  },

  /** 点击版本号时触发的函数 */
  debugMode() {
    // 关闭开发者模式
    if (developMode) {
      wx.setStorageSync("developMode", false);
      (this.data.page.content[0].content as any[]).forEach((x, y) => {
        x.hidden = y !== 0;
      });
      this.setData({ page: this.data.page });
      clickNumber = 0;
      developMode = false;

      // 不做任何操作
    } else if (clickNumber < 5) clickNumber += 1;
    // 提示还有几次点击即可启用开发者模式
    else if (clickNumber < 10) {
      tip(`再点击${10 - clickNumber}次即可启用开发者模式`);
      clickNumber += 1;

      // 启用开发者模式
    } else
      this.setData({ debug: true }, () => {
        wx.nextTick(() => {
          this.setData({ focus: true });
        });
      });
  },

  /**
   * 输入密码时出发的函数
   * 用于判断密码是否正确并启用开发者模式
   *
   * @param event 输入事件
   */
  password(event: WXEvent.Input) {
    if (event.detail.value.length === 7) {
      // 密码正确
      if (event.detail.value === "5201314") {
        tip("已启用开发者模式");
        (this.data.page.content[0].content as any[]).forEach((x) => {
          x.hidden = false;
        });
        this.setData({ page: this.data.page, debug: false });
        wx.setStorageSync("developMode", true);
        developMode = true;
      } else {
        // 密码错误
        wx.showToast({
          title: "密码错误",
          icon: "none",
          duration: 1000,
          image: "/icon/close.png",
        });
        this.setData({ debug: false });
      }

      // 清空输入框
      event.detail.value = "";
    }

    return event.detail.value;
  },

  /** 取消输入 */
  cancelInput() {
    this.setData({ debug: false });
  },

  /**
   * 控制调试开关
   *
   * @param value 开关状态
   */
  debugSwitch(value: boolean) {
    (this.data.page.content[0].content as any[])[2].status = value;
    this.setData({ page: this.data.page });
    wx.setStorageSync("debugMode", value);

    if (value) wx.setEnableDebug({ enableDebug: true });
    else wx.setEnableDebug({ enableDebug: false });
  },

  /**
   * 控制测试功能开关
   *
   * @param value 开关状态
   */
  testSwitch(value: boolean) {
    tip(`已${value ? "启用" : "关闭"}测试功能`);
  },

  /** 重定向到主页 */
  redirect() {
    this.$launch("main");
  },
});
