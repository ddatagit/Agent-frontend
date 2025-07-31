"use client";

import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
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
import * as XLSX from "xlsx";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";

interface Props {
  projectId: string;
}

const toolList = ["Daily Tasks", "Web Generator", "Deep Search"] as const;
const ToolEnum = z.enum(toolList);

const formSchema = z.object({
  value: z.string().min(1).max(999_999),
  projectId: z.string().min(1),
  tool: ToolEnum,
});

export const MessageForm = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTool, setSelectedTool] = useState<typeof toolList[number]>("Daily Tasks");

  useEffect(() => {
    const stored = localStorage.getItem("selectedTool") as typeof selectedTool;
    if (stored && toolList.includes(stored)) {
      setSelectedTool(stored);
    } else {
      localStorage.setItem("selectedTool", "Daily Tasks");
    }
  }, []);

  const handleToolChange = (tool: typeof selectedTool) => {
    setSelectedTool(tool);
    form.setValue("tool", tool); // sync tool to form
    localStorage.setItem("selectedTool", tool);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "", projectId, tool: selectedTool },
  });

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        form.reset({ value: "", projectId, tool: selectedTool });
        setExcelFileName(null);
        setExcelData(null);
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId })
        );
      },
      onError: (error) => toast.error(error.message),
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
        projectId,
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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const stringified = JSON.stringify(jsonData, null, 2);

      if (stringified.length > 50000) {
        toast.error("Excel content is too large. Please reduce the data.");
        return;
      }
      setExcelData(stringified);
      setExcelFileName(file.name);
    } catch {
      toast.error("Failed to parse Excel file.");
    }
  };

  const isPending = createMessage.isPending || isSubmitting;
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
              placeholder="What would you like to do with this data?"
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
            </kbd>{" "}Enter to submit
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
    </Form>
  );
};
