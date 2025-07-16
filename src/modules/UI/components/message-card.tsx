import { format } from "date-fns";
import type { Fragment } from "@/generated/prisma";
import type { MessageRole, MessageType } from "@/generated/prisma";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ChevronRight, ChevronRightIcon, Code2Icon } from "lucide-react";
import { Chevron } from "react-day-picker";

// -------------------- USER MESSAGE --------------------
interface UserMessageProps {
  content: string;
}

const UserMessage = ({ content }: UserMessageProps) => {
  return (
    <div className="flex justify-end p-4 pr-2 pl-10">
      <Card className="rounded-lg bg-muted p-3 shadow-none border-none max-w-[80%] break-words">
        {content}
      </Card>
    </div>
  );
};

// -------------------- ASSISTANT FRAGMENT --------------------
interface FragmentCardProps {
  fragment: Fragment;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
}

const FragmentCard = ({
  fragment,
  isActiveFragment,
  onFragmentClick,
}: FragmentCardProps) => {
  return (
    <button
      className={cn(
        "flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-3 hover:bg-secondary transition-colors",
        isActiveFragment &&
          "bg-primary text-primary-foreground border-primary hover:bg-primary"
      )}
      onClick={() => onFragmentClick(fragment)}
    >
      <Code2Icon className="size-4 mt-0.5" />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium line-clamp-1">
          {fragment.title}
        </span>
        <span className="text-sm">Preview</span>
      </div>
      <div className="flex items-center justify-center mt-0.5">
        <ChevronRightIcon className= "size-4"/>
      </div>
    </button>
  );
};

// -------------------- ASSISTANT MESSAGE --------------------
interface AssistantMessageProps {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
}

const ASSISTANTMessage = ({
  content,
  role,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
}: AssistantMessageProps) => {
  return (
    <div
      className={cn(
        "group flex flex-col px-4 py-2",
        type === "ERROR" && !fragment && "text-red-700 dark:text-red-500"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
          <Image
            src="/logo.svg"
            alt="dData AI Agent Logo"
            width={30}
            height={30}
            className="rounded-sm"
          />
        <span className="text-sm font-medium">dData AI Agent</span>
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-60 group-focus-within:opacity-60 transition-opacity">
          {format(createdAt, "HH:mm 'on' MMM dd, yyyy")}
        </span>
      </div>

      <div className="ml-8 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
        {content}
      </div>

      {fragment && (
        <div className="ml-8 mt-2">
          <FragmentCard
            fragment={fragment}
            isActiveFragment={isActiveFragment}
            onFragmentClick={onFragmentClick}
          />
        </div>
      )}
    </div>
  );
};

// -------------------- MAIN MESSAGE CARD --------------------
interface MessageCardProps {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
}

export const MessageCard = ({
  content,
  role,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
}: MessageCardProps) => {
  const normalizedRole = role?.toUpperCase?.();

  if (normalizedRole === "USER") {
    return <UserMessage content={content} />;
  }

  if (normalizedRole === "ASSISTANT") {
    return (
      <ASSISTANTMessage
        content={content}
        role={normalizedRole}
        fragment={fragment}
        createdAt={createdAt}
        isActiveFragment={isActiveFragment}
        onFragmentClick={onFragmentClick}
        type={type}
      />
    );
  }

  // fallback for other roles
  return (
    <div className="border p-4 rounded shadow-sm bg-white space-y-2">
      <div className="text-xs font-semibold text-gray-500">
        {role} — {format(createdAt, "yyyy-MM-dd HH:mm:ss")}
      </div>
      <div className="text-sm whitespace-pre-wrap text-gray-800">
        {content}
      </div>
    </div>
  );
};



//// work code but it doesn't same as youtube video code (ref)
//   return (
//     <div className="border p-4 rounded shadow-sm bg-white space-y-2">
//       <div className="text-xs font-semibold text-gray-500">
//         {role} — {format(createdAt, "yyyy-MM-dd HH:mm:ss")}
//       </div>

//       <div className="text-sm whitespace-pre-wrap text-gray-800">
//         {content}
//       </div>

//       {role === "ASSISTANT" && fragment && (
//         <div
//           onClick={() => onFragmentClick(fragment)}
//           className="mt-2 text-sm text-blue-600 font-medium cursor-pointer"
//         >
//           {fragment.title || "Preview"}
//         </div>
//       )}
//     </div>
//   );
// };
