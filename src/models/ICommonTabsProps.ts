import { ITabItem } from "./ITabItem";

export interface ICommonTabsProps {
  tabs: ITabItem[];
  selectedKey?: string;
  onTabClick?: (key: string) => void;
}
