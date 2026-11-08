import { z } from "zod"
import { type CreatorProfileInput, type ListingInput, type MyListing, minorOfRubles, rublesOfMinor, tagsOfText, textOfTags, type MyCreatorProfile } from "@/lib/cabinet"

const MAX_TAGS = 10
const MAX_TAG_LENGTH = 30
const MAX_LEAD_DAYS = 365

/** Every field of the showcase is optional on the API, so a draft can be saved step by step; the checklist says what is still missing. */
export const profileSchema = z.object({
  displayName: z.string().trim().max(80, "Не длиннее 80 символов."),
  bio: z.string().max(2000, "Не длиннее 2000 символов."),
  categoryId: z.string(),
  tags: z
    .string()
    .refine((text) => tagsOfText(text).length <= MAX_TAGS, `Не больше ${MAX_TAGS} тегов.`)
    .refine((text) => tagsOfText(text).every((tag) => tag.length <= MAX_TAG_LENGTH), `Тег не длиннее ${MAX_TAG_LENGTH} символов.`),
})

export type ProfileValues = z.input<typeof profileSchema>

export function profileValuesOf(profile: MyCreatorProfile): ProfileValues {
  return {
    displayName: profile.displayName ?? "",
    bio: profile.bio ?? "",
    categoryId: profile.category?.id ?? "",
    tags: textOfTags(profile.tags),
  }
}

/** The body of the save: empty name and category are left out (the API wants at least one character), the text fields go as they are. */
export function profileRequest(values: ProfileValues, cityId?: string): CreatorProfileInput {
  const request: CreatorProfileInput = { bio: values.bio, tags: tagsOfText(values.tags) }
  if (values.displayName.trim() !== "") request.displayName = values.displayName.trim()
  if (values.categoryId !== "") request.categoryId = values.categoryId
  if (cityId) request.cityId = cityId
  return request
}

export const listingSchema = z
  .object({
    type: z.enum(["SERVICE", "READY_PRODUCT", "MADE_TO_ORDER"]),
    title: z.string().trim().min(1, "Введите название.").max(120, "Не длиннее 120 символов."),
    description: z.string().max(4000, "Не длиннее 4000 символов."),
    categoryId: z.string().min(1, "Выберите категорию."),
    price: z.string().refine((text) => minorOfRubles(text) !== null, "Цена числом, например 1500 или 1500,50. Пусто — по договорённости."),
    deliveryAvailable: z.boolean(),
    durationText: z.string().max(100, "Не длиннее 100 символов."),
    inStock: z.boolean(),
    leadTimeDays: z.string(),
    hidden: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.type !== "MADE_TO_ORDER") return
    const days = Number(values.leadTimeDays)
    if (!Number.isInteger(days) || days < 1 || days > MAX_LEAD_DAYS) {
      context.addIssue({ code: "custom", path: ["leadTimeDays"], message: `Срок от 1 до ${MAX_LEAD_DAYS} дней.` })
    }
  })

export type ListingValues = z.input<typeof listingSchema>

export const EMPTY_LISTING: ListingValues = {
  type: "SERVICE",
  title: "",
  description: "",
  categoryId: "",
  price: "",
  deliveryAvailable: false,
  durationText: "",
  inStock: true,
  leadTimeDays: "",
  hidden: false,
}

export function listingValuesOf(listing: MyListing): ListingValues {
  return {
    type: listing.type,
    title: listing.title,
    description: listing.description,
    categoryId: listing.category.id,
    price: rublesOfMinor(listing.priceFromMinor),
    deliveryAvailable: listing.deliveryAvailable,
    durationText: listing.durationText ?? "",
    inStock: listing.inStock ?? true,
    leadTimeDays: listing.leadTimeDays === undefined ? "" : String(listing.leadTimeDays),
    hidden: listing.status === "HIDDEN",
  }
}

/**
 * The body of a save. A field that belongs to another type is never sent (the API refuses it), the price is left out for "by agreement",
 * and `attributes` (which this form does not edit yet) go back as they were so that saving does not erase them.
 */
export function listingRequest(values: ListingValues, attributes?: Record<string, string>, cityId?: string): ListingInput {
  const price = minorOfRubles(values.price)
  return {
    title: values.title.trim(),
    description: values.description,
    categoryId: values.categoryId,
    ...(typeof price === "number" ? { priceFromMinor: price } : {}),
    deliveryAvailable: values.deliveryAvailable,
    ...(values.type === "SERVICE" && values.durationText.trim() !== "" ? { durationText: values.durationText.trim() } : {}),
    ...(values.type === "READY_PRODUCT" ? { inStock: values.inStock } : {}),
    ...(values.type === "MADE_TO_ORDER" ? { leadTimeDays: Number(values.leadTimeDays) } : {}),
    ...(attributes ? { attributes } : {}),
    ...(cityId ? { cityId } : {}),
    status: values.hidden ? "HIDDEN" : "ACTIVE",
  }
}

export const portfolioSchema = z.object({
  title: z.string().trim().max(120, "Не длиннее 120 символов."),
  categoryId: z.string().min(1, "Выберите категорию."),
  subcategoryId: z.string(),
})

export type PortfolioValues = z.input<typeof portfolioSchema>
