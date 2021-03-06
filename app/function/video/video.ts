import $register = require("wxpage");

import { getImagePrefix, server } from "../../utils/config";
import { ensureJSON, getJSON } from "../../utils/file";
import { popNotice } from "../../utils/page";
import { tip } from "../../utils/wx";

import type { AppOption } from "../../app";

const { globalData } = getApp<AppOption>();

interface VideoConfig {
  /** 视频名称 */
  name: string;
  /** 视频作者 */
  author: string;
  /** 视频地址 */
  src?: string;
  /** 腾讯视频 ID */
  vid: string;
}

interface VideoGroup {
  /** 分组名称 */
  title: string;
  /** 分组内容 */
  content: VideoConfig[];
}

$register("video", {
  data: { videoName: "", videoList: [] as VideoGroup[] },

  onNavigate() {
    ensureJSON({
      path: "function/video/index",
      url: "resource/function/video/index",
    });
  },

  onLoad(options) {
    let groupID = 0;
    let listID = 0;

    getJSON({
      path: "function/video/index",
      url: "resource/function/video/index",
      success: (videoList) => {
        if (options.scene) {
          const ids = options.scene.split("-").map((id) => Number(id));

          [groupID, listID] = ids;
        } else if (options.name) {
          const name = decodeURI(options.name);

          (videoList as VideoGroup[]).forEach((videoGroup, groupIndex) => {
            const listIndex = videoGroup.content.findIndex(
              (videoItem) => videoItem.name === name
            );

            if (listIndex !== -1) {
              groupID = groupIndex;
              listID = listIndex;
            }
          });
        }

        const item = (videoList as VideoGroup[])[groupID].content[listID];

        this.setData({
          groupID,
          listID,

          titles: (videoList as VideoGroup[]).map(
            (videoListItem) => videoListItem.title
          ),
          videoList: videoList as VideoGroup[],

          videoName: item.name,
          videoAuthor: item.author,
          src: item.src || "",
          vid: item.vid || "",

          firstPage: getCurrentPages().length === 1,
          info: globalData.info,
          darkmode: globalData.darkmode,
        });
      },
    });

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.onThemeChange);

    popNotice("video");
  },

  onShow() {
    wx.loadFontFace({
      family: "FZSSJW",
      source: `url("${server}assets/fonts/FZSSJW.ttf")`,
      complete: (res) => {
        // 调试
        console.info(`Font status: ${res.status}`);
      },
    });

    this.createSelectorQuery()
      .select(".video-list")
      .fields({ size: true }, ({ height }) => {
        this.setData({ height: height as number });
      })
      .exec();
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.videoName,
      path: `/function/video/video?name=${this.data.videoName}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: this.data.videoName,
      query: `name=${this.data.videoName}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: this.data.videoName,
      imageUrl: `${getImagePrefix()}.jpg`,
      query: `name=${this.data.videoName}`,
    };
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.onThemeChange);
  },

  onThemeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  /** 切换播放视频 */
  change(event: WechatMiniprogram.TouchEvent) {
    const { groupID, listID } = event.currentTarget.dataset as Record<
      string,
      number
    >;
    const item = this.data.videoList[groupID].content[listID];

    this.setData({
      groupID,
      listID,
      videoName: item.name,
      videoAuthor: item.author,
      src: item.src || "",
      vid: item.vid || "",
    });
  },

  /** 视频缓冲时提示用户等待 */
  wait() {
    tip("缓冲中..");
  },

  /** 正常播放时隐藏提示 */
  play() {
    wx.hideToast();
  },

  /** 提示用户视频加载出错 */
  error() {
    tip("视频加载出错");
    // 调试
    wx.reportMonitor("5", 1);
  },

  /** 返回按钮功能 */
  back() {
    if (getCurrentPages().length === 1) this.$launch("main");
    else this.$back();
  },
});
