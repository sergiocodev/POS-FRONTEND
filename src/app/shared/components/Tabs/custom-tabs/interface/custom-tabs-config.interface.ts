import { TemplateRef } from "@angular/core";

export interface TabConfig {
    id: string;
    label: string;
    icon?: string;
    content?: TemplateRef<any>;
    visible?: boolean;
}

export interface CustomTabsConfig {
    title?: string;
    tabs: TabConfig[];
    defaultTab?: string;
    sharedContent?: TemplateRef<any>;
}
