"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { EyeIcon, CodeIcon, GithubIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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

type ViewMode = 'both' | 'message-focus' | 'fragment-focus';

export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code">("preview");
  const [viewMode, setViewMode] = useState<ViewMode>('both'); // 3 states: both, message-focus, fragment-focus

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

    const githubUsernameFromUrl = match[1];
    const repo = match[2];
    setIsPushing(true);

    try {
      const res = await fetch("/api/push-to-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          repo,
          rootDir,
          githubUsername: githubUsernameFromUrl,
          githubToken,
        }),
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

  const handleMiddleButtonClick = () => {
    if (viewMode === 'both') {
      setViewMode('fragment-focus');
    } else if (viewMode === 'fragment-focus') {
      setViewMode('message-focus');
    } else {
      setViewMode('both');
    }
  };

  const getLeftPanelSize = () => {
    switch (viewMode) {
      case 'message-focus': return 100;
      case 'fragment-focus': return 0;
      case 'both': return 35;
    }
  };

  const getRightPanelSize = () => {
    switch (viewMode) {
      case 'message-focus': return 0;
      case 'fragment-focus': return 100;
      case 'both': return 65;
    }
  };

  return (
    <div className="h-screen">
      {viewMode === 'both' ? (
        // BOTH MODE - Fully resizable panels
        <ResizablePanelGroup direction="horizontal">
          {/* LEFT PANEL - Messages */}
          <ResizablePanel 
            defaultSize={35} 
            minSize={20} 
            className="flex flex-col min-h-0 p-1"
          >
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

          {/* MIDDLE SEPARATOR WITH TOGGLE - Custom Design */}
          <div className="group w-1 relative h-full cursor-col-resize z-30 grid place-items-center">
            {/* Background Line */}
            <div className="absolute top-0 bottom-0 right-1 w-[0.5px] bg-border transition-all group-hover:delay-75 group-hover:bg-primary group-hover:w-px group-hover:translate-x-[0.5px]"></div>
            
            {/* Toggle Button */}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-2 p-0 relative rounded-full border border-border bg-background shadow transition-all duration-200 group-hover:delay-75 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground cursor-pointer z-40"
              onClick={handleMiddleButtonClick}
              title="Focus on Fragment"
            >
              <div className="w-1 h-1 bg-current rounded-full" />
            </Button>

            {/* Resizable Handle */}
            <ResizableHandle className="absolute inset-0 hover:bg-primary/10 transition-all duration-200 cursor-col-resize" />
          </div>

          {/* RIGHT PANEL - Fragment */}
          <ResizablePanel 
            defaultSize={65} 
            minSize={20} 
            className="flex flex-col p-1"
          >
            <Tabs
              className="h-full gap-y-0"
              defaultValue="preview"
              value={tabState}
              onValueChange={(value) => setTabState(value as "preview" | "code")}
            >
              {/* Tabs Header */}
              <div className="w-full flex items-center px-1 py-0.5 border-b border-border gap-x-1 text-sm">
                <TabsList className="h-8 p-0 border rounded-md">
                  <TabsTrigger value="preview" className="rounded-md">
                    <EyeIcon className="h-4 w-4" />
                    <span>Demo</span>
                  </TabsTrigger>
                  <TabsTrigger value="code" className="rounded-md">
                    <CodeIcon className="h-4 w-4" />
                    <span>Code</span>
                  </TabsTrigger>
                </TabsList>

                <div className="ml-auto flex items-center gap-x-2">
                  <Button size="sm" variant="outline" onClick={() => setShowGitInput(!showGitInput)}>
                    <GithubIcon className="mr-1 h-4 w-4" />
                    Git Push
                  </Button>
                </div>
              </div>

              {/* Git Input UI */}
              {showGitInput && (
                <div className="w-full flex flex-col gap-2 px-4 py-2 border-b bg-muted transition-all duration-200">
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
                  <p className="text-muted-foreground px-2 py-1 text-xs">Select a fragment to preview</p>
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
      ) : viewMode === 'message-focus' ? (
        // MESSAGE FOCUS MODE - Only message panel
        <div className="h-full flex flex-col transition-all duration-300 ease-in-out">
          <div className="group w-2 relative h-8 cursor-pointer z-30 grid place-items-center border-b">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 relative rounded-full border border-border bg-background shadow transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground cursor-pointer"
              onClick={handleMiddleButtonClick}
              title="Show Both Panels"
            >
              <ChevronLeftIcon className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 flex flex-col min-h-0 px-4 py-2 space-y-2">
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
          </div>
        </div>
      ) : (
        // FRAGMENT FOCUS MODE - Only fragment panel
        <div className="h-full flex flex-col transition-all duration-300 ease-in-out">
          <div className="group w-2 relative h-8 cursor-pointer z-30 grid place-items-center border-b">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 relative rounded-full border border-border bg-background shadow transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground cursor-pointer"
              onClick={handleMiddleButtonClick}
              title="Focus on Messages"
            >
              <ChevronRightIcon className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 flex flex-col">
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
                    <EyeIcon className="h-4 w-4" />
                    <span>Demo</span>
                  </TabsTrigger>
                  <TabsTrigger value="code" className="rounded-md">
                    <CodeIcon className="h-4 w-4" />
                    <span>Code</span>
                  </TabsTrigger>
                </TabsList>

                <div className="ml-auto flex items-center gap-x-2">
                  <Button size="sm" variant="outline" onClick={() => setShowGitInput(!showGitInput)}>
                    <GithubIcon className="mr-1 h-4 w-4" />
                    Git Push
                  </Button>
                </div>
              </div>

              {/* Git Input UI */}
              {showGitInput && (
                <div className="w-full flex flex-col gap-2 px-4 py-2 border-b bg-muted transition-all duration-200">
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
                  <p className="text-muted-foreground px-2 py-1 text-xs">Select a fragment to preview</p>

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
          </div>
        </div>
      )}
    </div>
  );
};
