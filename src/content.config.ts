import { date } from "astro/zod";
import { defineCollection, reference, z } from "astro:content";
import { glob, file } from "astro/loaders";

const properties = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/properties" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      reference: z.string(),
      draft: z.boolean().optional().default(false),
      status: z
        .enum(["available", "sold", "pending", "confidential"])
        .default("available"),
      city: z.string(),
      zip: z.string(),
      price: z.coerce.number(),
      rooms: z.coerce.number(),
      baths: z.coerce.number(),
      swimming_pool: z.boolean().optional().default(false),
      living_area: z.coerce.number().optional(),
      land_area: z.coerce.number().optional(),
      property_tax: z.coerce.number().optional(),
      summary: z.string().optional(),
      images: z.array(image()),
      floorplans: z.array(image()),
      videos: z.array(z.string().url()),
      meta: z
        .object({
          originalUrl: z.string().url().optional(),
          fetchedAt: date().optional(),
        })
        .optional(),
    }),
});

const staff = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/staff" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      position: z.string(),
      page_order: z.number().optional().default(0),
      email: z.string().optional(),
      phone: z.string().optional(),
      photo: image().optional(),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/pages" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      image: image().optional(),
    }),
});


export const collections = { properties, staff, pages };
