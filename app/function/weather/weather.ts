import $register = require("wxpage");

import { AppOption } from "../../app";
import { WeatherData } from "../../components/weather/typings";

import { server } from "../../utils/config";
import { readFile } from "../../utils/file";
import { modal } from "../../utils/wx";

const {
  globalData: { appID, darkmode, info },
} = getApp<AppOption>();

$register("weather", {
  data: {
    /** 天气数据 */
    weather: {} as WeatherData,
    /** 当前 tips 的索引值 */
    tipIndex: 0,
    /** 动画对象 */
    animation: {},
  },

  state: {
    weatherIcon: {} as Record<string, string>,
  },

  onLoad() {
    const weatherData = wx.getStorageSync("weather") as {
      date: number;
      data: WeatherData;
    };

    if (wx.getStorageSync("innenu-inited")) {
      const weatherIcon = JSON.parse(
        (readFile("./icon/weather/icon") as string) || "{}"
      ) as Record<string, string>;
      const hintIcon = JSON.parse(
        (readFile("./icon/weather/hint") as string) || "{}"
      ) as Record<string, string>;

      this.setData({
        // 18 点至次日 5 点为夜间
        night: new Date().getHours() > 18 || new Date().getHours() < 5,

        weatherIcon,
        hintIcon,

        firstPage: getCurrentPages().length === 1,
        info,
        darkmode,
      });
    } else {
      const handler = setInterval(() => {
        if (wx.getStorageSync("innenu-inited")) {
          this.setData({
            weatherIcon: JSON.parse(
              readFile("./icon/weather/icon") as string
            ) as Record<string, string>,
            hintIcon: JSON.parse(
              readFile("./icon/weather/hint") as string
            ) as Record<string, string>,
          });
          clearInterval(handler);
        }
      }, 500);
    }

    // 如果天气数据获取时间小于 5 分钟，则可以使用
    if (weatherData.date > new Date().getTime() - 300000) {
      const weather = weatherData.data;

      this.initcanvas(weather);

      this.setData({ weather });
    }
    // 需要重新获取并处理
    else
      wx.request({
        url: `${server}service/weatherData.php`,
        enableHttp2: true,
        success: (res) => {
          this.initcanvas(res.data as WeatherData);

          this.setData({
            weather: res.data as WeatherData,
          });
        },
      });

    // 设置页面背景色
    wx.setBackgroundColor({
      backgroundColorTop: darkmode ? "#000000" : "#efeef4",
      backgroundColor: darkmode ? "#000000" : "#efeef4",
      backgroundColorBottom: darkmode ? "#000000" : "#efeef4",
    });

    wx.onWindowResize(this.redrawCanvas);
    this.backgroundChange();

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onShareAppMessage: () => ({
    title: "东师天气",
    path: "/function/weather/weather",
  }),

  onShareTimeline: () => ({ title: "东师天气" }),

  onAddToFavorites: () => ({
    title: "体测计算器",
    imageUrl: `${server}img/${
      appID === "wx9ce37d9662499df3" ? "myNENU" : "inNENU"
    }.jpg`,
  }),

  onUnload() {
    /** 移除旋转屏幕与加速度计监听 */
    wx.offWindowResize(this.redrawCanvas);
    wx.stopAccelerometer({
      success: () => console.info("stop accelerometer listening success"),
    });
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  themeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  /**
   * 绘制温度曲线
   *
   * @param weather 天气详情
   */
  initcanvas(weather: WeatherData) {
    if (wx.canIUse("canvas.type"))
      wx.createSelectorQuery()
        .select(".canvas")
        .fields({ node: true, size: true })
        .exec((res: Required<WechatMiniprogram.NodeInfo>[]) => {
          const canvas = res[0].node;
          const context = canvas.getContext("2d");
          const dpr = info.pixelRatio;

          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          context.scale(dpr, dpr);
          this.draw(context, weather);
        });
    else this.canvasOldDraw(weather);
  },

  // eslint-disable-next-line
  draw(canvasContent: WechatMiniprogram.CanvasContext, weather: WeatherData) {
    // 为了防止 iPad 等设备可以转屏，必须即时获取
    const width = info.windowWidth;
    const highTemperature: number[] = [];
    const lowTemperature: number[] = [];
    const { dayForecast } = weather;
    let max = -50;
    let min = 50;

    // 生成最高 / 最低温
    dayForecast.forEach((element) => {
      const maxDegreee = Number(element.maxDegree);
      const minDegree = Number(element.minDegree);

      highTemperature.push(maxDegreee);
      lowTemperature.push(minDegree);
      if (maxDegreee > max) max = maxDegreee;
      if (minDegree < min) min = minDegree;
    });

    /** 温差 */
    const gap = max - min;

    canvasContent.beginPath();
    canvasContent.lineWidth = 2;
    canvasContent.font = "16px sans-serif";

    canvasContent.strokeStyle = "#ffb74d";
    canvasContent.fillStyle = "#ffb74d";

    // 绘制高温曲线
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - highTemperature[i]) / gap) * 100;

      if (i === 0) canvasContent.moveTo(x, y + 32);
      else canvasContent.lineTo(x, y + 32);
    }
    canvasContent.stroke();

    // 绘制高温度数值与点
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - highTemperature[i]) / gap) * 100;

      canvasContent.beginPath();
      canvasContent.arc(x, y + 32, 3, 0, Math.PI * 2);
      canvasContent.fill();

      canvasContent.fillText(`${dayForecast[i].maxDegree}°`, x - 10, y + 20);
    }

    canvasContent.beginPath();

    canvasContent.strokeStyle = "#4fc3f7";
    canvasContent.fillStyle = "#4fc3f7";

    // 绘制低温曲线
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - lowTemperature[i]) / gap) * 100;

      if (i === 0) canvasContent.moveTo(x, y + 20);
      else canvasContent.lineTo(x, y + 20);
    }
    canvasContent.stroke();

    // 绘制低温度数值与点
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - lowTemperature[i]) / gap) * 100;

      canvasContent.beginPath();
      canvasContent.arc(x, y + 20, 3, 0, Math.PI * 2);
      canvasContent.fill();

      canvasContent.fillText(`${dayForecast[i].minDegree}°`, x - 10, y + 44);
    }
  },

  /**
   * 绘制温度曲线
   *
   * @param weather 天气详情
   */
  // eslint-disable-next-line
  canvasOldDraw(weather: WeatherData) {
    // 为了防止 iPad 等设备可以转屏，必须即时获取
    const width = wx.getSystemInfoSync().windowWidth;
    /** 天气画布组件 */
    const canvasContent = wx.createCanvasContext("weather");
    const highTemperature: number[] = [];
    const lowTemperature: number[] = [];
    const { dayForecast } = weather;
    let max = -50;
    let min = 50;

    // 生成最高 / 最低温
    dayForecast.forEach((element) => {
      const maxDegreee = Number(element.maxDegree);
      const minDegree = Number(element.minDegree);

      highTemperature.push(maxDegreee);
      lowTemperature.push(minDegree);
      if (maxDegreee > max) max = maxDegreee;
      if (minDegree < min) min = minDegree;
    });

    /** 温差 */
    const gap = max - min;

    canvasContent.beginPath();
    canvasContent.lineWidth = 2;
    canvasContent.font = "16px sans-serif";

    canvasContent.strokeStyle = "#ffb74d";
    canvasContent.fillStyle = "#ffb74d";

    // 绘制高温曲线
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - highTemperature[i]) / gap) * 100;

      if (i === 0) canvasContent.moveTo(x, y + 32);
      else canvasContent.lineTo(x, y + 32);
    }
    canvasContent.stroke();
    canvasContent.draw();

    // 绘制高温度数值与点
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - highTemperature[i]) / gap) * 100;

      canvasContent.beginPath();
      canvasContent.arc(x, y + 32, 3, 0, Math.PI * 2);
      canvasContent.fill();
      canvasContent.draw(true);

      canvasContent.fillText(`${dayForecast[i].maxDegree}°`, x - 10, y + 20);
      canvasContent.draw(true);
    }

    canvasContent.beginPath();

    canvasContent.strokeStyle = "#4fc3f7";
    canvasContent.fillStyle = "#4fc3f7";

    // 绘制低温曲线
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - lowTemperature[i]) / gap) * 100;

      if (i === 0) canvasContent.moveTo(x, y + 20);
      else canvasContent.lineTo(x, y + 20);
    }
    canvasContent.stroke();
    canvasContent.draw(true);

    // 绘制低温度数值与点
    for (let i = 0; i < dayForecast.length; i += 1) {
      const x = width / 10 + (i * width) / 5;
      const y = ((max - lowTemperature[i]) / gap) * 100;

      canvasContent.beginPath();
      canvasContent.arc(x, y + 20, 3, 0, Math.PI * 2);
      canvasContent.fill();
      canvasContent.draw(true);

      canvasContent.fillText(`${dayForecast[i].minDegree}°`, x - 10, y + 44);
      canvasContent.draw(true);
    }
  },

  /** 旋转屏幕时重绘画布 */
  redrawCanvas() {
    if (wx.canIUse("canvas.type"))
      wx.createSelectorQuery()
        .select(".canvas")
        .fields({ node: true, size: true })
        .exec((res: Required<WechatMiniprogram.NodeInfo>[]) => {
          this.draw(res[0].node.getContext("2d"), this.data.weather);
        });
    else this.canvasOldDraw(this.data.weather);
  },

  /** 改变背景动画 */
  backgroundChange() {
    /** 动画选项 */
    const animationOptions: WechatMiniprogram.StepOption = {
      duration: 200,
      timingFunction: "ease",
    };
    /** 背景层1动画 */
    const layer1Animation = wx.createAnimation(animationOptions);
    /** 背景层2动画 */
    const layer2Animation = wx.createAnimation(animationOptions);
    /** 背景层3动画 */
    const layer3Animation = wx.createAnimation(animationOptions);

    wx.startAccelerometer({
      interval: "normal",
      success: () => console.info("Start accelerometer listening success"),
    });

    wx.onAccelerometerChange((res) => {
      layer1Animation.translateX(res.x * 13.5).step();
      layer2Animation.translateX(res.x * 18).step();
      layer3Animation.translateX(res.x * 22.5).step();

      this.setData({
        animation1: layer1Animation.export(),
        animation2: layer2Animation.export(),
        animation3: layer3Animation.export(),
      });
    });
  },

  /** 更新提示 */
  refresh() {
    const { length } = this.data.weather.tips;
    const numbers = this.data.tipIndex;

    this.setData({ tipIndex: numbers === 0 ? length - 1 : numbers - 1 });
  },

  /** 贴士详情 */
  hint({ currentTarget }: WechatMiniprogram.TouchEvent) {
    const hint = this.data.weather.hints[currentTarget.dataset.id as number];

    modal(hint.name, hint.detail);
  },

  /** 返回按钮功能 */
  back() {
    if (getCurrentPages().length === 1) this.$launch("main");
    else this.$back();
  },
});
