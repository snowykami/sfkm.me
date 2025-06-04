import { User, Award, MessageCircle, PanelsTopLeft, Users, Music, SquareChevronRight, Orbit, Code, Send } from "lucide-react";
import ProfileApp from "@/apps/Profile";
import ProjectsApp from "@/apps/Projects";
import SkillsApp from "@/apps/Skills";
import ContactApp from "@/apps/Contacts";
import FriendsApp from "@/apps/Friends";
import MusicApp, { WINDOW_ID as musicWindowId, musicWindowState } from "@/apps/Music";
import Terminal from "./Terminal";
import Ech0 from "./Echo";
import { AppProps } from "./BaseApp";
import { WindowState } from "@/contexts/WindowManagerContext";
import VSCode from "./VSCode";
import LiteyukiLab from "./LiteyukiLab";

// 参考屏幕尺寸 - 2K屏幕
const REFERENCE_WIDTH = 2560;
const REFERENCE_HEIGHT = 1440;

// 获取适应屏幕的尺寸 - 基于2K屏幕等比例缩放
function getAdaptiveSize(baseWidth: number, baseHeight: number): { width: number, height: number } {
  // 服务器端渲染时提供默认值
  if (typeof window === 'undefined') {
    return { width: baseWidth, height: baseHeight };
  }

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  console.log(`[窗口调试] 屏幕尺寸: ${screenWidth}x${screenHeight}`);
  console.log(`[窗口调试] 原始窗口尺寸: ${baseWidth}x${baseHeight}`);

  // 计算缩放比例 - 取宽度和高度比例的较小值以确保窗口完全可见
  const widthScale = screenWidth / REFERENCE_WIDTH;
  const heightScale = screenHeight / REFERENCE_HEIGHT;
  const scale = Math.min(widthScale, heightScale);

  console.log(`[窗口调试] 缩放系数: 宽度=${widthScale.toFixed(3)}, 高度=${heightScale.toFixed(3)}, 使用=${scale.toFixed(3)}`);

  // 顶部栏和Dock保留空间
  const TOPBAR_HEIGHT = 28;
  const DOCK_HEIGHT = 60;
  const availableHeight = screenHeight - TOPBAR_HEIGHT - DOCK_HEIGHT;

  console.log(`[窗口调试] 可用高度: ${availableHeight}px (减去顶部栏${TOPBAR_HEIGHT}px和Dock${DOCK_HEIGHT}px)`);

  // 应用缩放比例
  let width = Math.round(baseWidth * scale);
  let height = Math.round(baseHeight * scale);

  console.log(`[窗口调试] 按比例缩放后: ${width}x${height}`);

  // 确保窗口不会超出屏幕
  const maxWidth = Math.floor(screenWidth * 0.9);
  const maxHeight = Math.floor(availableHeight * 0.9);

  const oldWidth = width;
  const oldHeight = height;

  width = Math.min(width, maxWidth);
  height = Math.min(height, maxHeight);

  if (width !== oldWidth || height !== oldHeight) {
    console.log(`[窗口调试] 调整以适应屏幕: ${width}x${height} (最大允许: ${maxWidth}x${maxHeight})`);
  }

  // 保持最小尺寸
  const minWidth = 320;
  const minHeight = 400;

  const beforeMinCheck = { width, height };

  width = Math.max(width, minWidth);
  height = Math.max(height, minHeight);

  if (width !== beforeMinCheck.width || height !== beforeMinCheck.height) {
    console.log(`[窗口调试] 调整到最小尺寸: ${width}x${height} (最小要求: ${minWidth}x${minHeight})`);
  }

  console.log(`[窗口调试] 最终窗口尺寸: ${width}x${height}`);

  return {
    width,
    height
  };
}

// 基于2K屏幕设计的原始窗口尺寸
// 自适应窗口状态
export const phoneWindowState: Partial<WindowState> = {
  size: getAdaptiveSize(400, 800) // 移动应用窗口
};

export const smallWindowState: Partial<WindowState> = {
  size: getAdaptiveSize(800, 600) // 小型应用窗口
};

export const mediumWindowState: Partial<WindowState> = {
  size: getAdaptiveSize(1000, 700) // 中型应用窗口
};

export const largeWindowState: Partial<WindowState> = {
  size: getAdaptiveSize(1600, 900) // 大型应用窗口
};

export interface AppMeta {
  id: string;
  icon: React.ReactNode;
  label: string;
  entry: React.ComponentType<AppProps>;
  windowState?: Partial<WindowState>;
  showInDock?: boolean
}

const iconClassName = "w-6 h-6"
export const apps: AppMeta[] = [
  {
    id: "profile", icon: <User className={iconClassName} />, label: "profile.title", entry: ProfileApp,
    windowState: phoneWindowState, showInDock: true
  },
  {
    id: "projects", icon: <PanelsTopLeft className={iconClassName} />, label: "projects.title", entry: ProjectsApp,
    windowState: phoneWindowState, showInDock: true
  },
  {
    id: "skills", icon: <Award className={iconClassName} />, label: "skills.title", entry: SkillsApp,
    windowState: phoneWindowState,
    showInDock: true
  },
  {
    id: "contact", icon: <MessageCircle className={iconClassName} />, label: "contacts.title", entry: ContactApp,
    windowState: phoneWindowState, showInDock: true
  },
  {
    id: "friends", icon: <Users className={iconClassName} />, label: "friends.title", entry: FriendsApp,
    windowState: phoneWindowState, showInDock: true
  },
  {
    id: musicWindowId, icon: <Music className={iconClassName} />, label: "music.title", entry: MusicApp,
    windowState: { ...{ size: { height: mediumWindowState.size?.height || 700, width: mediumWindowState.size?.width || 1000 } }, ...musicWindowState, }, showInDock: true
  },
  {
    id: "ech0", icon: <Send className={iconClassName} />, label: "Ech0", entry: Ech0,
    windowState: phoneWindowState, showInDock: true
  },
  {
    id: "liteyukilab", icon: <Orbit className={iconClassName} />, label: "liteyukilab.title", entry: LiteyukiLab,
    windowState: mediumWindowState, showInDock: true
  },
  {
    id: "terminal", icon: <SquareChevronRight className={iconClassName} />, label: "terminal.title", entry: Terminal,
    windowState: mediumWindowState, showInDock: true
  },
  {
    id: "vscode", icon: <Code className={iconClassName} />, label: "vscode.title", entry: VSCode,
    windowState: mediumWindowState, showInDock: true
  }
];

// 监听窗口大小变化，动态更新窗口状态
if (typeof window !== 'undefined') {
  // 初始化时打印一次所有窗口状态
  console.log('[窗口调试] 初始窗口状态:');
  console.log(`[窗口调试] phoneWindowState: ${JSON.stringify(phoneWindowState.size)}`);
  console.log(`[窗口调试] smallWindowState: ${JSON.stringify(smallWindowState.size)}`);
  console.log(`[窗口调试] mediumWindowState: ${JSON.stringify(mediumWindowState.size)}`);
  console.log(`[窗口调试] largeWindowState: ${JSON.stringify(largeWindowState.size)}`);

  // 使用防抖函数避免频繁触发
  let resizeTimeout: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      console.log('[窗口调试] 窗口大小改变，重新计算...');

      // 更新窗口状态中的尺寸值 - 使用原始的2K屏幕设计尺寸
      const phoneSize = getAdaptiveSize(400, 800);
      const smallSize = getAdaptiveSize(800, 600);
      const mediumSize = getAdaptiveSize(1000, 700);
      const largeSize = getAdaptiveSize(1600, 900);

      // 检查窗口状态是否实际更新
      const oldPhoneSize = { ...phoneWindowState.size! };
      const oldSmallSize = { ...smallWindowState.size! };
      const oldMediumSize = { ...mediumWindowState.size! };
      const oldLargeSize = { ...largeWindowState.size! };

      Object.assign(phoneWindowState.size!, phoneSize);
      Object.assign(smallWindowState.size!, smallSize);
      Object.assign(mediumWindowState.size!, mediumSize);
      Object.assign(largeWindowState.size!, largeSize);

      console.log(`[窗口调试] phoneWindowState: ${JSON.stringify(oldPhoneSize)} -> ${JSON.stringify(phoneWindowState.size)}`);
      console.log(`[窗口调试] smallWindowState: ${JSON.stringify(oldSmallSize)} -> ${JSON.stringify(smallWindowState.size)}`);
      console.log(`[窗口调试] mediumWindowState: ${JSON.stringify(oldMediumSize)} -> ${JSON.stringify(mediumWindowState.size)}`);
      console.log(`[窗口调试] largeWindowState: ${JSON.stringify(oldLargeSize)} -> ${JSON.stringify(largeWindowState.size)}`);
    }, 200); // 200ms 防抖延迟
  });
}

// 默认配置 - 根据屏幕大小自动选择窗口尺寸
export function getDefaultWindowState(): Partial<WindowState> {
  if (typeof window === 'undefined') {
    return mediumWindowState;
  }

  const width = window.innerWidth;
  const scale = width / REFERENCE_WIDTH; // 计算相对于参考宽度的缩放比例

  // 根据相对缩放比例选择窗口类型
  if (scale < 0.3) { // 小于768px
    return phoneWindowState;
  } else if (scale < 0.4) { // 小于1024px
    return smallWindowState;
  } else if (scale < 0.56) { // 小于1440px
    return mediumWindowState;
  } else {
    return largeWindowState;
  }
}

// 根据应用类型获取合适的窗口状态
export function getAppWindowState(appId: string): Partial<WindowState> {
  const app = apps.find(a => a.id === appId);
  return app?.windowState || getDefaultWindowState();
}

// 按需计算尺寸 - 用于动态创建的窗口
export function getScaledSize(width: number, height: number): { width: number, height: number } {
  return getAdaptiveSize(width, height);
}