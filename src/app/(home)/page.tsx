"use client";

import Image from "next/image";
import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectsList } from "@/modules/home/ui/components/project-list";
import { useTheme } from "next-themes";
import { SunMoonIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const Page = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative flex flex-col max-w-5xl mx-auto w-full">
      <div className="absolute right-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <SunMoonIcon className="w-50 h-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main content */}
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <div className="flex flex-col items-center">
          <Image src="/logo.svg" alt="dData" width={100} height={100} />
        </div>

        <h1 className="text-2xl md:text-5xl font-bold text-center">
          Build something with dData AI-Agent
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground text-center">
          Create apps and websites by chatting with AI-Agent
        </p>

        <div className="max-w-3xl mx-auto w-full">
          <ProjectForm />
        </div>
      </section>

      <ProjectsList />
    </div>
  );
};

export default Page;
