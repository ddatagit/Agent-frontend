import { useForm } from "react-hook-form";
import { useRef, useState } from "react";
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
import * as XLSX from "xlsx";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";

interface Props {
  projectId: string;
}

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Prompt or value is required" })
    .max(999999, { message: "Prompt must be under 1000000 characters" }),
  projectId: z.string().min(1, { message: "Project ID is required" }),
});

export const MessageForm = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
      projectId,
    },
  });

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        form.reset();
        setExcelFileName(null);
        setExcelData(null);
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId })
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const fullPrompt = excelData
      ? `${values.value}\n\n${excelData}`
      : values.value;

    await createMessage.mutateAsync({
      value: fullPrompt,
      projectId,
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

  const isPending = createMessage.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;
  const showUsage = false;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-xs",
          showUsage && "rounded-t-none"
        )}
      >
        {/* Attached file name display */}
        {excelFileName && (
          <div className="mb-2 flex items-center justify-between bg-muted px-3 py-1 rounded text-sm text-muted-foreground">
            <span>File "{excelFileName}" attached</span>
            <button
              type="button"
              onClick={() => {
                setExcelData(null);
                setExcelFileName(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""; // reset file input to allow same file
                }
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Prompt Textarea */}
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

        {/* Footer: Tips + Buttons */}
        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="text-[10px] text-muted-foreground font-mono">
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span>&#8984;</span>Enter
            </kbd>
            &nbsp; to submit
          </div>

          <div className="flex items-center gap-2">
            {/* Upload Excel Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""; // clear before re-click
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

            {/* Submit Button */}
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
  );
};
