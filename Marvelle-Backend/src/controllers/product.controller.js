const { z } = require('zod');

const { getPrisma } = require('../db/prismaClient');

const imageSchema = z.object({
  url: z.string().url('Image URL must be valid'),
  alt: z.string().optional(),
});

const shadeSchema = z.object({
  name: z.string().min(1),
  hexColor: z
    .string()
    .regex(/^#?[0-9a-fA-F]{6}$/, 'Hex must be a 6 character hex code')
    .transform((value) => (value.startsWith('#') ? value : `#${value}`)),
  sku: z.string().optional(),
  price: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
});

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  finish: z.string().optional(),
  basePrice: z.number().min(0),
  collectionId: z.string().nullish(),
  images: z.array(imageSchema).optional(),
  shades: z.array(shadeSchema).optional(),
});

const productInclude = {
  collection: true,
  images: true,
  shades: {
    include: {
      inventory: true,
    },
  },
  reviews: {
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    include: {
      media: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  _count: {
    select: {
      reviews: {
        where: { status: 'PUBLISHED' },
      },
    },
  },
};

const toDecimalString = (value) =>
  value !== undefined && value !== null ? value.toString() : null;

const buildProductData = (payload) => ({
  name: payload.name,
  slug: payload.slug,
  description: payload.description,
  finish: payload.finish,
  basePrice: toDecimalString(payload.basePrice),
  collection: payload.collectionId
    ? { connect: { id: payload.collectionId } }
    : undefined,
  images: payload.images?.length
    ? {
        create: payload.images.map((image) => ({
          url: image.url,
        })),
      }
    : undefined,
  shades: payload.shades?.length
    ? {
        create: payload.shades.map((shade) => ({
          name: shade.name,
          hexColor: shade.hexColor.toUpperCase(),
          sku: shade.sku ?? null,
          price: toDecimalString(shade.price),
          inventory: {
            create: {
              quantity: shade.quantity ?? 0,
            },
          },
        })),
      }
    : undefined,
});

const normalizeBulkItem = (item) => {
  const normalized = {
    ...item,
    basePrice:
      item.basePrice === undefined || item.basePrice === null
        ? item.basePrice
        : Number(item.basePrice),
    shades: Array.isArray(item.shades)
      ? item.shades.map((shade) => ({
          ...shade,
          price:
            shade.price === undefined || shade.price === null
              ? shade.price
              : Number(shade.price),
          quantity:
            shade.quantity === undefined || shade.quantity === null
              ? shade.quantity
              : Number(shade.quantity),
        }))
      : undefined,
  };
  return productSchema.parse(normalized);
};

const toProductResponse = (product) => {
  if (!product) return product;

  const publishedReviews = Array.isArray(product.reviews)
    ? product.reviews.filter((review) => review.status === 'PUBLISHED' || !review.status)
    : [];

  const countValue = product._count?.reviews;
  const reviewCount =
    typeof countValue === 'number'
      ? countValue
      : Array.isArray(product.reviews)
      ? product.reviews.length
      : 0;

  const averageRating =
    publishedReviews.length > 0
      ? Number(
          (
            publishedReviews.reduce((total, current) => total + current.rating, 0) /
            publishedReviews.length
          ).toFixed(2)
        )
      : 0;

  return {
    ...product,
    averageRating,
    reviewCount,
  };
};

exports.listProducts = async (req, res, next) => {
  try {
    const prisma = await getPrisma();
    const { q } = req.query;
    const products = await prisma.product.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: productInclude,
    });
    const mapped = products.map(toProductResponse);
    return res.status(200).json(mapped);
  } catch (error) {
    return next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const prisma = await getPrisma();
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productInclude,
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json(toProductResponse(product));
  } catch (error) {
    return next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const payload = productSchema.parse(req.body);
    const prisma = await getPrisma();

    const product = await prisma.product.create({
      data: buildProductData(payload),
      include: productInclude,
    });

    return res.status(201).json(toProductResponse(product));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: error.errors[0]?.message || 'Invalid payload',
      });
    }
    if (error.code === 'P2002') {
      return res
        .status(409)
        .json({ message: 'Product slug already exists' });
    }
    return next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const payload = productSchema.partial().parse(req.body);
    const prisma = await getPrisma();

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        finish: payload.finish,
        basePrice:
          payload.basePrice !== undefined
            ? toDecimalString(payload.basePrice)
            : undefined,
        collection: payload.collectionId
          ? { connect: { id: payload.collectionId } }
          : payload.collectionId === null
          ? { disconnect: true }
          : undefined,
        images: payload.images
          ? {
              deleteMany: {},
              create: payload.images.map((image) => ({
                url: image.url,
              })),
            }
          : undefined,
      },
      include: productInclude,
    });

    if (payload.shades) {
      await prisma.inventory.deleteMany({
        where: { shade: { productId: product.id } },
      });
      await prisma.shade.deleteMany({
        where: { productId: product.id },
      });

      if (payload.shades.length) {
        const createdShades = await prisma.shade.createMany({
          data: payload.shades.map((shade) => ({
            name: shade.name,
            hexColor: shade.hexColor.toUpperCase(),
            sku: shade.sku ?? null,
            price: toDecimalString(shade.price),
            productId: product.id,
          })),
        });

        if (createdShades.count) {
          const shades = await prisma.shade.findMany({
            where: { productId: product.id },
          });
          await Promise.all(
            shades.map((shade, index) =>
              prisma.inventory.create({
                data: {
                  shadeId: shade.id,
                  quantity: payload.shades?.[index]?.quantity ?? 0,
                },
              })
            )
          );
        }
      }
    }

    const refreshed = await prisma.product.findUnique({
      where: { id: product.id },
      include: productInclude,
    });

    return res.status(200).json(toProductResponse(refreshed));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: error.errors[0]?.message || 'Invalid payload',
      });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (error.code === 'P2002') {
      return res
        .status(409)
        .json({ message: 'Product slug already exists' });
    }
    return next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const prisma = await getPrisma();
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    return res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' });
    }
    return next(error);
  }
};

exports.bulkImportProducts = async (req, res, next) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Provide an array of products under "items".' });
  }

  const prisma = await getPrisma();
  const summary = {
    created: 0,
    updated: 0,
    failed: 0,
    results: [],
  };

  for (const rawItem of items) {
    try {
      const payload = normalizeBulkItem(rawItem);
      const existing = await prisma.product.findUnique({
        where: { slug: payload.slug },
      });

      if (existing) {
        await prisma.productImage.deleteMany({ where: { productId: existing.id } });
        await prisma.inventory.deleteMany({ where: { shade: { productId: existing.id } } });
        await prisma.shade.deleteMany({ where: { productId: existing.id } });

        await prisma.product.update({
          where: { id: existing.id },
          data: buildProductData(payload),
        });

        summary.updated += 1;
        summary.results.push({ slug: payload.slug, status: 'updated' });
      } else {
        await prisma.product.create({
          data: buildProductData(payload),
        });
        summary.created += 1;
        summary.results.push({ slug: payload.slug, status: 'created' });
      }
    } catch (error) {
      summary.failed += 1;
      summary.results.push({
        slug: rawItem?.slug ?? rawItem?.name ?? 'unknown',
        status: 'failed',
        message: error.message || 'Unable to import product',
      });
    }
  }

  return res.status(200).json(summary);
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

exports.exportProducts = async (_req, res, next) => {
  try {
    const prisma = await getPrisma();
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        collection: true,
        shades: {
          include: { inventory: true },
        },
      },
    });

    const headers = [
      'Name',
      'Slug',
      'Base price (INR)',
      'Collection',
      'Shades',
      'Shade SKUs',
      'Shade Quantities',
    ];

    const rows = products.map((product) => {
      const shadeNames = product.shades.map((shade) => shade.name).join(' | ');
      const shadeSkus = product.shades.map((shade) => shade.sku ?? '').join(' | ');
      const shadeQty = product.shades
        .map((shade) => shade.inventory?.quantity ?? 0)
        .join(' | ');
      return [
        product.name,
        product.slug,
        product.basePrice,
        product.collection?.name ?? '',
        shadeNames,
        shadeSkus,
        shadeQty,
      ];
    });

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return next(error);
  }
};
