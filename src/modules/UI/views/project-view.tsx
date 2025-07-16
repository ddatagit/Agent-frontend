"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { EyeIcon, CodeIcon, GithubIcon } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { MessageContainer } from "../components/messages-container";
import type { Fragment } from "@/generated/prisma";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { FileExplorer } from "@/components/ui/file-explorer";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code">("preview");

  const [showGitInput, setShowGitInput] = useState(false);
  const [gitUrl, setGitUrl] = useState("");
  const [rootDir, setRootDir] = useState("app");
  const [isPushing, setIsPushing] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [githubToken, setGithubToken] = useState("");


  const [filePath, setFilePath] = useState(""); // For scrolling to specific file

  const handleGitPush = async () => {
    const match = gitUrl.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      alert("Invalid GitHub URL. It should look like: https://github.com/username/repo");
      return;
    }

    const repo = match[2];
    setIsPushing(true);

    try {
      const res = await fetch("/api/push-to-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, repo, rootDir }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ Pushed:\n${data.pushed.join("\n")}${data.failed.length ? `\n\n❌ Failed:\n${data.failed.join("\n")}` : ""}`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      alert("Unexpected error while pushing to GitHub.");
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        {/* LEFT PANEL */}
        <ResizablePanel defaultSize={35} minSize={20} className="flex flex-col min-h-0">
          <Suspense fallback={<p>Loading project...</p>}>
            <ProjectHeader projectId={projectId} />
          </Suspense>
          <Suspense fallback={<p>Loading messages...</p>}>
            <MessageContainer
              projectId={projectId}
              onFragmentClick={setActiveFragment}
              activeFragment={activeFragment}
            />
          </Suspense>
        </ResizablePanel>

        <ResizableHandle className="hover:bg-primary transistion-colors" />

        {/* RIGHT PANEL */}
        <ResizablePanel defaultSize={65} minSize={50} className="p-0 flex flex-col">
          <Tabs
            className="h-full gap-y-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value) => setTabState(value as "preview" | "code")}
          >
            {/* Tabs Header */}
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon />
                  <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon />
                  <span>Code</span>
                </TabsTrigger>
              </TabsList>

              <div className="ml-auto flex items-center gap-x-2">
                <Button size="sm" variant="outline" onClick={() => setShowGitInput(!showGitInput)}>
                  <GithubIcon className="mr-1" />
                  Git Push
                </Button>
              </div>
            </div>

      {/* Git Input UI */}
      {showGitInput && (
        <div className="w-full flex flex-col gap-2 px-4 py-2 border-b bg-muted">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="GitHub Username"
              className="border px-2 py-1 rounded-md text-sm w-1/3"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="GitHub Token"
              className="border px-2 py-1 rounded-md text-sm w-2/3"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
          </div>

          <input
            type="text"
            placeholder="GitHub repo URL (e.g. https://github.com/user/repo)"
            className="border px-2 py-1 rounded-md"
            value={gitUrl}
            onChange={(e) => setGitUrl(e.target.value)}
          />

          <input
            type="text"
            placeholder="Root folder (e.g. app, src)"
            className="border px-2 py-1 rounded-md"
            value={rootDir}
            onChange={(e) => setRootDir(e.target.value)}
          />

          <Button onClick={handleGitPush} disabled={isPushing}>
            {isPushing ? "Pushing..." : "Push Now"}
          </Button>
        </div>
      )}


            {/* Preview Tab */}
            <TabsContent
              value="preview"
              className="flex-1 overflow-auto flex items-center justify-center"
            >
              {!!activeFragment ? (
                <FragmentWeb data={activeFragment} />
              ) : (
                <p className="text-gray-500 p-4">Select a fragment to preview</p>
              )}
            </TabsContent>


            {/* Code Tab */}
            <TabsContent value="code" className="flex-1 overflow-auto p-0">
              {!!activeFragment && activeFragment.files && typeof activeFragment.files === "object" ? (
                <FileExplorer files={activeFragment.files as Record<string, string>} />
              ) : (
                <div className="text-gray-500 p-4">No file content found.</div>
              )}
            </TabsContent>

          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};



// //with output git push button
// export const ProjectView = ({ projectId }: Props) => {
//   const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
//   const [tabState, setTabState] = useState<"preview" | "code">("preview");

//   return (
//     <div className="h-screen">
//       <ResizablePanelGroup direction="horizontal">
//         {/* LEFT PANEL */}
//         <ResizablePanel defaultSize={35} minSize={20} className="flex flex-col min-h-0">
//           <Suspense fallback={<p>Loading project...</p>}>
//             <ProjectHeader projectId={projectId} />
//           </Suspense>
//           <Suspense fallback={<p>Loading messages...</p>}>
//             <MessageContainer
//               projectId={projectId}
//               onFragmentClick={setActiveFragment}
//               activeFragment={activeFragment}
//             />
//           </Suspense>
//         </ResizablePanel>

//         <ResizableHandle withHandle />

//         {/* RIGHT PANEL */}
//         <ResizablePanel defaultSize={65} minSize={50} className="p-0 flex flex-col">
//           <Tabs
//             className="h-full gap-y-0"
//             defaultValue="preview"
//             value={tabState}
//             onValueChange={(value) => setTabState(value as "preview" | "code")}
//           >
//             {/* Tabs Header */}
//             <div className="w-full flex items-center p-2 border-b gap-x-2">
//               <TabsList className="h-8 p-0 border rounded-md">
//                 <TabsTrigger value="preview" className="rounded-md">
//                   <EyeIcon />
//                   <span>Demo</span>
//                 </TabsTrigger>
//                 <TabsTrigger value="code" className="rounded-md">
//                   <CodeIcon />
//                   <span>Code</span>
//                 </TabsTrigger>
//               </TabsList>

//               {/* <div className="ml-auto flex items-center gap-x-2">
//                 <Button asChild size="sm" variant="default">
//                   <Link href="/pricing">
//                     <CrownIcon className="mr-1" />
//                     Upgrade
//                   </Link>
//                 </Button>
//               </div> */}
//             </div>

//             {/* Tabs Content */}
//             <TabsContent value="preview" className="flex-1 overflow-auto">
//               {!!activeFragment ? (
//                 <FragmentWeb data={activeFragment} />
//               ) : (
//                 <p className="text-gray-500 p-4">Select a fragment to preview</p>
//               )}
//             </TabsContent>

//             <TabsContent value="code" className="flex-1 overflow-auto p-4">
//               <p className="text-gray-500">TODO: Show generated code here</p>
//             </TabsContent>
//           </Tabs>
//         </ResizablePanel>
//       </ResizablePanelGroup>
//     </div>
//   );
// };



