"use client";
import TemplateGrid from "@/components/ui/TemplateGrid";
import { useForm } from "react-hook-form";
import { useRef, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import TextareaAutosize from "react-textarea-autosize";
import {
  ArrowUpIcon,
  Loader2Icon,
  FileUpIcon,
  XIcon,
  ChevronDownIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { inngest } from "@/inngest/client";
import { PROJECT_TEMPLATES } from "../../contants";

const TOOLS = {
  DAILY: "Daily Tasks",
  WEB: "Web Generator",
  DEEP: "Deep Search",
} as const;

type ToolType = (typeof TOOLS)[keyof typeof TOOLS];

const formSchema = z.object({
  value: z.string().min(1).max(999_999),
  projectId: z.string().min(1),
  tool: z.enum([TOOLS.DAILY, TOOLS.WEB, TOOLS.DEEP]),
});

export const ProjectForm = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolType>(TOOLS.DAILY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toolList: ToolType[] = [TOOLS.DAILY, TOOLS.WEB, TOOLS.DEEP];

  useEffect(() => {
    const stored = localStorage.getItem("selectedTool") as ToolType | null;
    if (stored && toolList.includes(stored)) {
      setSelectedTool(stored);
    } else {
      localStorage.setItem("selectedTool", TOOLS.DAILY);
    }
  }, []);

  const handleToolChange = (tool: ToolType) => {
    setSelectedTool(tool);
    localStorage.setItem("selectedTool", tool);
  };

  const handleTemplateSelect = (prompt: string) => {
    form.setValue("value", prompt);
  };

  const createEmptyProject = useMutation(
    trpc.projects.createEmpty.mutationOptions({
      onSuccess: (data) => setProjectId(data.id),
      onError: () => toast.error("Failed to create project"),
    })
  );

  useEffect(() => {
    createEmptyProject.mutate();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "", projectId: "", tool: TOOLS.DAILY },
  });

  useEffect(() => {
    if (projectId) form.setValue("projectId", projectId);
  }, [projectId, form]);

  const createMessage = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        setExcelData(null);
        setExcelFileName(null);
        form.reset({ value: "", projectId: "", tool: selectedTool });
        router.push(`/projects/${data.id}`);
      },
      onError: (err) => {
        toast.error(`Failed to create project: ${err.message}`);
      },
    })
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    const fullPrompt = excelData
      ? `${values.value}\n\n${excelData}`
      : values.value;

    try {
      await createMessage.mutateAsync({
        value: fullPrompt,
        tool: selectedTool,
      });
    } catch (err: any) {
      toast.error(`Failed for ${selectedTool}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const json = JSON.stringify(rows, null, 2);

      if (json.length > 50_000) {
        toast.error("Excel content too large.");
        return;
      }
      setExcelData(json);
      setExcelFileName(file.name);
    } catch {
      toast.error("Failed to read Excel file");
    }
  };

  const isPending =
    createEmptyProject.isPending ||
    createMessage.isPending ||
    isSubmitting ||
    !projectId;

  const isButtonDisabled = isPending || !form.formState.isValid;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isPending ? "opacity-80" : "shadow-sm"
        )}
      >
        {excelFileName && (
          <div className="mb-2 flex items-center justify-between bg-muted px-3 py-1 rounded text-sm text-muted-foreground">
            <span>File "{excelFileName}" attached</span>
            <button
              type="button"
              onClick={() => {
                setExcelData(null);
                setExcelFileName(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        )}

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <TextareaAutosize
              {...field}
              disabled={isPending}
              minRows={2}
              maxRows={8}
              className="pt-4 resize-none border-none w-full outline-none bg-transparent"
              placeholder="What would you like to do?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)(e);
                }
              }}
            />
          )}
        />

        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="text-[10px] text-muted-foreground font-mono">
            <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-1.5">
              ⌘
            </kbd>{" "}
            Enter to submit
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  {selectedTool}
                  <ChevronDownIcon className="size-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={4}
                  align="start"
                  className="bg-popover text-popover-foreground rounded-md border p-1 shadow-md w-40"
                >
                  {toolList.map((tool) => (
                    <DropdownMenu.Item
                      key={tool}
                      className={cn(
                        "flex items-center px-2 py-1 text-sm cursor-pointer rounded-sm",
                        tool === selectedTool
                          ? "font-medium bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      )}
                      onSelect={() => handleToolChange(tool)}
                    >
                      {tool}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUpIcon className="size-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="submit"
              disabled={isButtonDisabled}
              className={cn(
                "size-8 rounded-full flex items-center justify-center",
                isButtonDisabled && "bg-muted-foreground border"
              )}
            >
              {isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ArrowUpIcon className="size-4" />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Template section */}
      <div className="mt-6 space-y-2">
        <p className="text-center text-sm font-medium text-muted-foreground mb-1">
          Our Feature:
        </p>
        <TemplateGrid onTemplateSelect={handleTemplateSelect} />
      </div>

      {/* <div className="mt-6">
        <p className="text-center text-sm font-medium text-muted-foreground mb-2">
          features :
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
          {PROJECT_TEMPLATES.map((template) => (
            <Button
              key={template.title}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-sidebar"
              onClick={() => handleTemplateSelect(template.prompt)}
            >
              <span className="mr-1">{template.emoji}</span> {template.title}
            </Button>
          ))}
        </div>
      </div> */}
    </Form>
  );
};
