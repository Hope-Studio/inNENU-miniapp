import { ImageComponentConfig } from "../../../../typings";

Component<{ config: ImageComponentConfig; images: string[] }>({
  properties: {
    /** 图片组件配置 */
    config: Object,

    /** 展示图片列表 */
    images: {
      type: Array,
      value: [] as string[],
    },
  },

  methods: {
    /** 图片加载完成 */
    load(): void {
      this.setData({ loaded: true });
    },

    /** 图片加载出错 */
    error(): void {
      this.setData({ error: true });

      console.warn(`${this.data.config.src}图片加载失败`);
      wx.reportMonitor("10", 1);
    },

    /** 进行图片预览 */
    view(): void {
      const current = this.data.config.res || this.data.config.src;

      wx.previewImage({
        current,
        urls: this.data.images.length === 0 ? [current] : this.data.images,
      });
    },
  },
});
