import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { enforceQuota } from "../quota.server";

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const productId = formData.get("productId");
    const imageUrl = formData.get("imageUrl");
    const imageId = formData.get("imageId");

    if (!productId || !imageUrl) {
        return json({ error: "Missing data" }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
        where: { shopDomain: session.shop }
    });

    if (!shop) {
        return json({ error: "Shop not found" }, { status: 404 });
    }

    const existing = await prisma.productAsset.findFirst({
        where: { shopId: shop.id, productId: String(productId) }
    });

    // Enforce quota
    try {
        await enforceQuota(shop.id, "prep", 1);
    } catch (error) {
        if (error instanceof Response) {
            const data = await error.json();
            return json(data, { status: 429 });
        }
        throw error;
    }

    if (existing) {
        await prisma.productAsset.update({
            where: { id: existing.id },
            data: { status: "pending", sourceImageUrl: String(imageUrl) }
        });
    } else {
        await prisma.productAsset.create({
            data: {
                shopId: shop.id,
                productId: String(productId),
                sourceImageId: String(imageId) || "unknown",
                sourceImageUrl: String(imageUrl),
                status: "pending",
                prepStrategy: "manual",
                promptVersion: 1,
                createdAt: new Date()
            }
        });
    }

    return json({ success: true });
};
