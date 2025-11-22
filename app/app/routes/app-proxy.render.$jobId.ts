import { LoaderFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
    const { session } = await authenticate.public.appProxy(request);

    if (!session) {
        return json({ status: "forbidden" }, { status: 403 });
    }

    const { jobId } = params;

    const job = await prisma.renderJob.findUnique({
        where: { id: jobId },
        include: { shop: true }
    });

    if (!job || job.shop.shopDomain !== session.shop) {
        return json({ error: "Job not found" }, { status: 404 });
    }

    return json({
        job_id: job.id,
        status: job.status,
        image_url: job.imageUrl,
        error_code: job.errorCode,
        error_message: job.errorMessage
    });
};
