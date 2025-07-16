"use client";

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
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { PROJECT_TEMPLATES } from "@/modules/home/contants";

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Prompt or value is required" })
    .max(999999, { message: "Prompt must be under 1000000 characters" }),
  projectId: z.string().min(1, { message: "Project ID is required" }),
});

export const ProjectForm = () => {
  const trpc = useTRPC();
  const router = useRouter(); // ✅ Required for redirect
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Create an empty project on mount
  const createEmptyProject = useMutation(
    trpc.projects.createEmpty.mutationOptions({
      onSuccess: (data) => {
        setProjectId(data.id);
      },
      onError: (err) => {
        toast.error("Failed to create project");
      },
    })
  );

  useEffect(() => {
    createEmptyProject.mutate();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
      projectId: "",
    },
  });

  useEffect(() => {
    if (projectId) {
      form.setValue("projectId", projectId);
    }
  }, [projectId]);

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        form.reset({ value: "", projectId });
        setExcelFileName(null);
        setExcelData(null);
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId: projectId! })
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!projectId) return;

    const fullPrompt = excelData
      ? `${values.value}\n\n${excelData}`
      : values.value;

    await createMessage.mutateAsync({
      value: fullPrompt,
      projectId,
    });

    // ✅ Redirect to project page after first message
    router.push(`/projects/${projectId}`);
  };

  const handleTemplateSelect = (value: string) => {
    form.setValue("value", value, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
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
    } catch (err) {
      toast.error("Failed to parse Excel file.");
    }
  };

  const isPending =
    createMessage.isPending || createEmptyProject.isPending || !projectId;
  const isButtonDisabled = isPending || !form.formState.isValid;

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
            isFocused && "shadow-xs"
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
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon className="w-4 h-4" />
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
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
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
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span>&#8984;</span>Enter
              </kbd>
              &nbsp; to submit
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                    fileInputRef.current.click();
                  }
                }}
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
                disabled={isButtonDisabled}
                type="submit"
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

      <div className="flex flex-wrap justify-center gap-2 max-w-3xl mt-4">
        {PROJECT_TEMPLATES.map((template) => (
          <Button
            key={template.title}
            variant="outline"
            size="sm"
            className="bg-white dark:bg-sidebar"
            onClick={() => handleTemplateSelect(template.prompt)}
          >
            {template.emoji} {template.title}
          </Button>
        ))}
      </div>
    </>
  );
};
