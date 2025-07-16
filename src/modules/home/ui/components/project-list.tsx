"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const ProjectsList = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: projects, isLoading } = useQuery(
    trpc.projects.getMany.queryOptions()
  );

  const deleteAllMutation = useMutation(
    trpc.projects.deleteAll.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.projects.getMany.queryKey()),
    })
  );

  const deleteOneMutation = useMutation(
    trpc.projects.deleteOne.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.projects.getMany.queryKey()),
    })
  );

  const filteredProjects = projects?.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full bg-white dark:bg-sidebar rounded-xl p-8 border flex flex-col gap-y-6 sm:gap-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Previous chat</h2>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteAllMutation.mutate()}
                disabled={deleteAllMutation.isPending || !projects?.length}
                className="text-muted-foreground hover:text-destructive transition"
              >
                <Trash2Icon className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete all projects</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {filteredProjects?.length === 0 && (
          <div className="col-span-full text-center">
            <p className="text-sm text-muted-foreground">No projects found</p>
          </div>
        )}

        {filteredProjects?.map((project) => (
          <div
            key={project.id}
            className="border rounded-md px-4 py-3 flex items-start justify-between"
          >
            <div className="flex gap-3 items-center w-full">
              <Image
                src="/logo.svg"
                alt="dData"
                width={32}
                height={32}
                className="object-contain"
              />

              <Link
                href={`/projects/${project.id}`}
                className="flex flex-col w-full"
              >
                <h3 className="truncate font-medium">{project.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(project.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
              </Link>
            </div>

            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      deleteOneMutation.mutate({ id: project.id })
                    }
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
