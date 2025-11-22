import prisma from "./db.server";

export async function enforceQuota(shopId, type, count = 1) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.$transaction(async (tx) => {
        const shop = await tx.shop.findUnique({ where: { id: shopId } });
        if (!shop) throw new Error("Shop not found");

        let usage = await tx.usageDaily.findUnique({
            where: { shopId_date: { shopId, date: today } },
        });

        if (!usage) {
            usage = await tx.usageDaily.create({
                data: { shopId, date: today },
            });
        }

        const limit = shop.dailyQuota;
        let currentUsage = 0;

        // Option A: Quota is based on composite renders only.
        // Prep logs usage but does not block.
        if (type === "render") {
            currentUsage = usage.compositeRenders;

            if (currentUsage + count > limit) {
                throw new Response(
                    JSON.stringify({
                        error: "quota_exceeded",
                        message: "Daily quota exceeded for your current plan. Upgrade to increase your limit.",
                    }),
                    {
                        status: 429,
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }
        }

        // Increment
        const updateData = {};
        if (type === "render") {
            updateData.compositeRenders = { increment: count };
        } else if (type === "prep") {
            updateData.prepRenders = { increment: count };
        }

        await tx.usageDaily.update({
            where: { id: usage.id },
            data: updateData,
        });

        return true;
    });
}
