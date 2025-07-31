import { ProjectView } from "@/modules/UI/views/project-view";
import { getQueryClient, trpc } from "@/trpc/server";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

interface Props {
  params: {
    projectId: string;
  };
}

const Page = ({ params }: { params: { projectId: string } }) => {
  const { projectId } = params;
  
  const queryClient = getQueryClient();
    void queryClient.prefetchQuery(
    trpc.messages.getMany.queryOptions({
        projectId: projectId,
    })
);
    void queryClient.prefetchQuery(
    trpc.projects.getOne.queryOptions({
        id: projectId,
    })
);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<p>Loading</p>}>
        <ProjectView projectId = {projectId} />
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;