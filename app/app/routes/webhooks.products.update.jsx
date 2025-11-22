import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
    const { shop, topic, payload, admin } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    if (!payload || !payload.id) {
        console.error("Invalid webhook payload");
        return new Response(null, { status: 200 });
    }

    try {
        const productId = `gid://shopify/Product/${payload.id}`;

        // IMPORTANT: Featured image MUST be resolved via Shopify Admin GraphQL.
        // DO NOT use webhook payload or images[0] - always fetch from GraphQL.
        // This ensures we compare against the actual current featured image.
        const response = await admin.graphql(
            `#graphql
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          featuredImage {
            id
          }
          images(first: 250) {
            edges {
              node {
                id
              }
            }
          }
        }
      }`,
            {
                variables: { id: productId }
            }
        );

        const responseJson = await response.json();
        const product = responseJson.data?.product;

        if (!product) {
            console.log(`Product ${productId} not found via GraphQL`);
            return new Response(null, { status: 200 });
        }

        // Featured image ID from GraphQL (source of truth)
        const currentFeaturedImageId = product.featuredImage?.id || null;

        // All current product image IDs
        const currentImageIds = product.images.edges.map(edge => edge.node.id);

        // Find shop in database
        const shopRecord = await prisma.shop.findUnique({
            where: { shopDomain: shop },
        });

        if (!shopRecord) {
            console.log(`Shop ${shop} not found in database`);
            return new Response(null, { status: 200 });
        }

        // Find all product assets for this product
        const assets = await prisma.productAsset.findMany({
            where: {
                shopId: shopRecord.id,
                productId: productId,
            },
        });

        // Process each asset to detect stale status
        for (const asset of assets) {
            const sourceImageId = asset.sourceImageId;

            // Rule 1: If sourceImageId matches current featured image, asset is still valid
            if (sourceImageId === currentFeaturedImageId) {
                // Asset is still valid, no change needed
                continue;
            }

            // Rule 2: If sourceImageId exists in product images but is NOT the featured image
            if (currentImageIds.includes(sourceImageId)) {
                // Mark as stale (image changed position/role)
                await prisma.productAsset.update({
                    where: { id: asset.id },
                    data: {
                        status: "stale",
                        updatedAt: new Date(),
                    },
                });
                console.log(`Marked asset ${asset.id} as stale (image no longer featured)`);
                continue;
            }

            // Rule 3: If sourceImageId no longer exists in product images at all
            // Mark as stale with orphaned flag in configJson
            await prisma.productAsset.update({
                where: { id: asset.id },
                data: {
                    status: "stale",
                    configJson: JSON.stringify({ orphaned: true }),
                    updatedAt: new Date(),
                },
            });
            console.log(`Marked asset ${asset.id} as stale+orphaned (source image deleted)`);
        }

    } catch (error) {
        console.error("Error processing products/update webhook:", error);
    }

    return new Response(null, { status: 200 });
};
