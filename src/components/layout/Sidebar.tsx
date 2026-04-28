"use client";

import React, { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Newspaper,
  User,
  BookOpen,
  Sparkles,
  Crown,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { meetsTier } from "@/lib/tiers";
import type { SubscriptionTier } from "@/types/subscription";

const premiumItems = [
  {
    label: "Starter Content",
    href: "/members-portal/starter",
    tier: "starter" as const,
    icon: BookOpen,
  },
  {
    label: "Pro Content",
    href: "/members-portal/pro",
    tier: "pro" as const,
    icon: Sparkles,
  },
  {
    label: "Enterprise Content",
    href: "/members-portal/enterprise",
    tier: "enterprise" as const,
    icon: Crown,
  },
];

const Sidebar = () => {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>("free");

  useEffect(() => {
    const fetchTier = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && data.tier) {
        setCurrentTier(data.tier as SubscriptionTier);
      }
    };

    fetchTier();
  }, []);

  return (
    <Command className="bg-secondary">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList className="px-8">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <Link href="/members-portal">Dashboard</Link>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Premium Content">
          {premiumItems.map((item) => {
            const hasAccess = meetsTier(currentTier, item.tier);
            return (
              <CommandItem
                key={item.href}
                className={hasAccess ? "" : "opacity-50"}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <Link href={item.href} className="flex-grow">
                  {item.label}
                </Link>
                {!hasAccess && <Lock className="h-3 w-3 ml-auto" />}
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem>
            <Newspaper className="mr-2 h-4 w-4" />
            <Link href="/members-portal/account">Subscription</Link>
          </CommandItem>
          <CommandItem>
            <User className="mr-2 h-4 w-4" />
            <Link href="/members-portal/profile">Profile</Link>
            <CommandShortcut>&#x2318; P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export default Sidebar;
