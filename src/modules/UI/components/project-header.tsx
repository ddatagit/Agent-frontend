"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  SunMoonIcon,
  Trash2Icon,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

interface Props {
  projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: project } = useSuspenseQuery(
    trpc.projects.getOne.queryOptions({ id: projectId })
  );

  const deleteMutation = useMutation(
    trpc.projects.deleteOne.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.projects.getMany.queryKey(),
        });
        router.push("/"); // redirect to dashboard
      },
    })
  );

  return (
    <header className="p-2 flex justify-between items-center border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity pl-2"
          >
            <Image src="/logo.svg" alt="lovable" width={30} height={30} />
            <span className="text-sm font-medium ml-2 text-black dark:text-white truncate max-w-[150px]">
              {project.name}
            </span>
            <ChevronDownIcon className="ml-1 w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="start" className="w-64">
          <DropdownMenuItem
            onClick={() => deleteMutation.mutate({ id: projectId })}
            className="text-destructive focus:text-destructive"
          >
            <Trash2Icon className="w-4 h-4 mr-2" />
            Delete Project
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/" className="flex items-center w-full">
              <ChevronLeftIcon className="mr-2 h-4 w-4" />
              <span>Go to Dashboard</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <SunMoonIcon className="size-4 text-muted-foreground" />
              <span>Appearance</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={setTheme}
                >
                  <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
