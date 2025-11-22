import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PLANS } from "../billing";
import prisma from "../db.server";

export const loader = async ({ request }) => {
    const { billing, session } = await authenticate.admin(request);

    // Verify payment
    const billingCheck = await billing.check();

    if (billingCheck.hasActivePayment) {
        // Assuming only one paid plan (PRO) for now
        // In a multi-plan setup, we'd check the subscription name
        await prisma.shop.update({
            where: { shopDomain: session.shop },
            data: {
                plan: PLANS.PRO.id,
                dailyQuota: PLANS.PRO.dailyQuota,
                monthlyQuota: PLANS.PRO.monthlyQuota,
            },
        });
    } else {
        // If no payment found (e.g. user cancelled), ensure we are on FREE
        await prisma.shop.update({
            where: { shopDomain: session.shop },
            data: {
                plan: PLANS.FREE.id,
                dailyQuota: PLANS.FREE.dailyQuota,
                monthlyQuota: PLANS.FREE.monthlyQuota,
            },
        });
    }

    return redirect("/app");
};
