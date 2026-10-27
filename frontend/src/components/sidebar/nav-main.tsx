import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const NavMain = ({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) => {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
        Quản lý hệ thống
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const isParentActive = item.items?.some(
            (subItem) => location.pathname === subItem.url,
          );
          const hasChildren = item.items && item.items.length > 0;

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isParentActive}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={cn(
                      "w-full cursor-pointer transition-all duration-200 group/collapsible",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "data-[state=open]:bg-sidebar-accent/50",
                      isParentActive &&
                        "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                    )}
                  >
                    <item.icon className="shrink-0" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {hasChildren && (
                      <ChevronRight
                        className={cn(
                          "ml-auto shrink-0 transition-transform duration-200",
                          "group-data-[state=open]/collapsible:rotate-90",
                        )}
                      />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {hasChildren ? (
                  <CollapsibleContent className="transition-all duration-200 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <SidebarMenuSub className="ml-0 border-l-2 border-sidebar-border/50 pl-0">
                      {item.items?.map((subItem) => {
                        const isSubActive = location.pathname === subItem.url;

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                              className={cn(
                                "cursor-pointer transition-colors duration-150 ml-4",
                                "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                                isSubActive &&
                                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-primary -ml-px",
                              )}
                            >
                              <Link to={subItem.url}>
                                <span className="truncate">
                                  {subItem.title}
                                </span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};
