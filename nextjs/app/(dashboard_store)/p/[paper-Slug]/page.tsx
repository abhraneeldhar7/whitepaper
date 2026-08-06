import { auth } from "@clerk/nextjs/server";
import { createApiClient, ApiError } from "@/lib/api/api-client";
import { getPaperBySlug } from "@/lib/api/services/papers";
import { notFound } from "next/navigation";
import { RESERVED_SLUGS } from "@/shared/constants";
import PaperReadOnly from "@/components/editor/test/PaperReadOnly";
import PaperEditor from "@/components/editor/test/PaperEditor";

export default async function PaperPage({ params }: { params: Promise<{ "paper-Slug": string }> }) {
    const { "paper-Slug": slug } = await params;

    if (RESERVED_SLUGS.paper.includes(slug)) {
        return <PaperEditor />;
    }

    const { getToken } = await auth();
    const token = await getToken();
    const client = createApiClient(token);

    let result: Awaited<ReturnType<typeof getPaperBySlug>> = null;

    try {
        result = await getPaperBySlug(slug, true, client);
    } catch (e) {
        if (e instanceof ApiError) {
            if (e.status === 404) notFound();
            if (e.status === 403) return <PaperReadOnly error="unauthorized" />;
        }
        throw e;
    }

    if (!result) notFound();

    const { role, data: paper } = result;
    const canEdit = role !== "viewer";

    if (canEdit) {
        return <div className="flex-1 flex flex-col">
            <PaperEditor paper={paper} />
        </div>
    }

    return <PaperReadOnly paper={paper} />;
}
