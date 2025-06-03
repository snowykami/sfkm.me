import { User, Award, MessageCircle, PanelsTopLeft, Users, Music, Earth, SquareChevronRight } from "lucide-react";
import ProfileApp from "@/apps/Profile";
import ProjectsApp from "@/apps/Projects";
import SkillsApp from "@/apps/Skills";
import ContactApp from "@/apps/Contacts";
import FriendsApp from "@/apps/Friends";
import MusicApp, { WINDOW_ID as musicWindowId, musicWindowState } from "@/apps/Music";
import Browser from "./Browser";
import Terminal from "./Terminal";
import Monitor from "./Monitor";
import { AppProps } from "./BaseApp";
import { WindowState } from "@/contexts/WindowManagerContext";

export const phoneWindowState: Partial<WindowState> = {
  size: {
    width: 400,
    height: 650
  }
};

export const smallWindowState: Partial<WindowState> = {
  size: {
    width: 800,
    height: 600
  }
};

export const mediumWindowState: Partial<WindowState> = {
  size: {
    width: 1000,
    height: 700
  }
};

export const largeWindowState: Partial<WindowState> = {
  size: {
    width: 1600,
    height: 900
  }
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
    windowState: musicWindowState, showInDock: true
  },
  {
    id: "terminal", icon: <SquareChevronRight className={iconClassName} />, label: "terminal.title", entry: Terminal,
    windowState: mediumWindowState, showInDock: true
  },
  {
    id: "browser", icon: <Earth className={iconClassName} />, label: "browser.title", entry: Browser,
    windowState: mediumWindowState, showInDock: true
  },
  // {
  //   id: "test-empty", icon: <SquareChevronRight className={iconClassName} />, label: "empty.title", entry: Monitor, showInDock: true
  // }
];