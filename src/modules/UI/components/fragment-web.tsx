import { useState } from "react";
import { ExternalLinkIcon, RefreshCcwIcon } from "lucide-react";

import { Fragment } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";

interface Props {
  data: Fragment;
}

export function FragmentWeb({ data }: Props) {
  const [fragmentKey, setFragmentKey] = useState(0);
  const [copied, setCopied] = useState<boolean>(false);

  const onRefresh  = () =>{
    setFragmentKey((prev) => prev+1);
  };

  const handleCopy = () => {
  navigator.clipboard.writeText(data.sandboxUrl);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
  };

  return (
  <div className="w-full h-full overflow-y-auto overflow-x-hidden">
    <div className="p-2 boarder-b bg-sidebar flex items-center gap-x-2">
      <Button size="sm" variant="outline" onClick={onRefresh}>
        <RefreshCcwIcon />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleCopy}
        disabled={!data.sandboxUrl || copied}
        className="flex-1 justify-start text-start font-normal"
      >
        <span className="truncate">{data.sandboxUrl}</span>
      </Button>
      <Hint text="Open in a new tab" side="bottom" align="start">
        <Button
          size="sm"
          disabled={!data.sandboxUrl}
          variant="outline"
          onClick={() => {
            if (!data.sandboxUrl) return;
            window.open(data.sandboxUrl, "_blank");
          }}
        >
          <ExternalLinkIcon />
        </Button>
      </Hint>
    </div>

    {/* ✅ Conditionally render iframe only if sandboxUrl is truthy */}
    {data.sandboxUrl ? (
      <iframe
        key={fragmentKey}
        className="w-full h-full border rounded"
        sandbox="allow-scripts allow-same-origin allow-forms"
        loading="lazy"
        src={data.sandboxUrl}
        scrolling="yes"
      />
    ) : (
      <div className="p-4 text-muted-foreground">No preview available.</div>
    )}
  </div>
);
}