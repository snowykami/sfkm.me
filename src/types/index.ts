import { LucideProps } from "lucide-react";
import { IconType } from "react-icons";

type Icon = React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>> | IconType | string;

export interface Contact {
    // icon可以是Lucide图标组件或url资源
    icon: Icon;
    label: string;
    value: string;
    link: string;
}

export interface Friend {
    name: string;
    description?: string;
    link: string;
    avatar: string;
    tags?: (React.ReactNode | string)[];
}

export interface Project {
    name: string;
    description: string;
    status: "active" | "inactive" | "archived" | "completed";
    link: string;
    tags?: (React.ReactNode | string)[];
}

export interface Skill {
    name: string;
    level: number; // 数字表示百分比，文本表示水平对应25%、50%、75%、100%
    category: "frontend" | "backend" | "devops" | "database" | "mobile" | "other";
    icon?: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>> | string;
    description?: string;
}

export interface Site {
    label: string;
    url: string;
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>> | string;
}

export interface SkillBadge {
  key: string
  label: string
  className: string
}