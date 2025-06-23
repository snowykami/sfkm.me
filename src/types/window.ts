export interface windowColorScheme {
  bg?: string;
  bgDark?: string;
  border?: string;
  borderDark?: string;
  title?: string;
  titleDark?: string;
  titleBarBg?: string; // 标题栏背景色
  titleBarBgDark?: string; // 标题栏背景色（暗黑模式）
  titleBarBorder?: string; // 标题栏边框色
  titleBarBorderDark?: string; // 标题栏边框色（暗黑模式）
  titleBarClassName?: string; // 标题栏自定义类名
  shadow?: string; // 窗口阴影
  // 新增：窗口背景图片
  backgroundImage?: string;
  // 新增：窗口自定义背景色（优先级高于bg/bgDark）
  backgroundColor?: string;
  backgroundColorDark?: string;
  // 新增：背景混合模式
  backgroundBlendMode?: string;
  // 新增：背景不透明度
  backgroundOpacity?: string;
  // 新增：是否模糊背景
  backgroundClassName?: string; // 背景模糊的CSS类名
  backdropBlur?: boolean;
  backdropBlurClass?: string; // 模糊背景的CSS类名
  showBorder?: boolean; // 是否显示边框
  backgroundOverlay?: boolean; // 是否启用背景蒙版
  overlayColor?: string; // 蒙版颜色
  overlayColorDark?: string; // 暗模式蒙版颜色
  overlayBlendMode?: string; // 蒙版混合模式
  overlayGradient?: string; // 蒙版渐变设置
}
