import { auth } from "@clerk/nextjs/server";
import { createApiClient, ApiError } from "@/lib/api/api-client";
import { getPaperBySlug, type PaperWithRole } from "@/lib/api/services/papers";
import { notFound } from "next/navigation";
import { PaperReadOnly } from "@/components/editor/readonly";
import { PaperEditor } from "@/components/editor/editor";

export default async function PaperPage({ params }: { params: Promise<{ "paper-Slug": string }> }) {
    const { "paper-Slug": slug } = await params;
    const { getToken } = await auth();
    const token = await getToken();
    const client = createApiClient(token);

    let paperWithRole: PaperWithRole | null = null;

    try {
        paperWithRole = await getPaperBySlug(slug, client);
    } catch (e) {
        if (e instanceof ApiError) {
            if (e.status === 404) notFound();
            if (e.status === 403) return <PaperReadOnly error="unauthorized" />;
        }
        throw e;
    }

    if (!paperWithRole) notFound();

    const canEdit = paperWithRole.role !== "viewer";

    if (canEdit) {
        return <PaperEditor paper={paperWithRole} />;
    }

    return <PaperReadOnly paper={paperWithRole} />;
}
