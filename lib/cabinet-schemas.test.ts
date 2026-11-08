import { describe, expect, it } from "vitest"
import type { MyCreatorProfile, MyListing } from "./cabinet"
import { EMPTY_LISTING, listingRequest, listingSchema, listingValuesOf, portfolioSchema, profileRequest, profileSchema, profileValuesOf } from "./cabinet-schemas"

const CATEGORY = "0192f1c6-1111-7000-8000-000000000001"

describe("profileSchema and profileRequest", () => {
  it("lets a draft be saved without a name and a category, and leaves them out of the request", () => {
    const values = { displayName: "  ", bio: "О себе", categoryId: "", tags: "" }

    expect(profileSchema.safeParse(values).success).toBe(true)
    expect(profileRequest(values)).toEqual({ bio: "О себе", tags: [] })
  })

  it("sends the trimmed name, the category and the tags as a list", () => {
    expect(profileRequest({ displayName: " Анна ", bio: "", categoryId: CATEGORY, tags: "кружки, ручная работа" })).toEqual({
      displayName: "Анна",
      bio: "",
      categoryId: CATEGORY,
      tags: ["кружки", "ручная работа"],
    })
  })

  it("keeps the tags within the limits of the contract", () => {
    const eleven = Array.from({ length: 11 }, (_, index) => `т${index}`).join(",")

    expect(profileSchema.safeParse({ displayName: "", bio: "", categoryId: "", tags: eleven }).success).toBe(false)
    expect(profileSchema.safeParse({ displayName: "", bio: "", categoryId: "", tags: "я".repeat(31) }).success).toBe(false)
    expect(profileSchema.safeParse({ displayName: "", bio: "", categoryId: "", tags: "я".repeat(30) }).success).toBe(true)
  })

  it("fills the form from the showcase", () => {
    const profile = { id: "x", status: "DRAFT", suspensionReasons: [], tags: ["а", "б"], changedSinceReview: false, createdAt: "", displayName: "Анна" } as MyCreatorProfile

    expect(profileValuesOf(profile)).toEqual({ displayName: "Анна", bio: "", categoryId: "", tags: "а, б" })
  })
})

describe("listingSchema", () => {
  const base = { ...EMPTY_LISTING, title: "Кружка", categoryId: CATEGORY }

  it("wants a title and a category", () => {
    expect(listingSchema.safeParse(EMPTY_LISTING).success).toBe(false)
    expect(listingSchema.safeParse(base).success).toBe(true)
  })

  it("takes a price as rubles or nothing, and refuses text", () => {
    expect(listingSchema.safeParse({ ...base, price: "1 500,50" }).success).toBe(true)
    expect(listingSchema.safeParse({ ...base, price: "дорого" }).success).toBe(false)
  })

  it("wants a lead time of 1 to 365 days for an order, and only for an order", () => {
    expect(listingSchema.safeParse({ ...base, type: "MADE_TO_ORDER", leadTimeDays: "" }).success).toBe(false)
    expect(listingSchema.safeParse({ ...base, type: "MADE_TO_ORDER", leadTimeDays: "366" }).success).toBe(false)
    expect(listingSchema.safeParse({ ...base, type: "MADE_TO_ORDER", leadTimeDays: "14" }).success).toBe(true)
    expect(listingSchema.safeParse({ ...base, type: "SERVICE", leadTimeDays: "" }).success).toBe(true)
  })
})

describe("listingRequest", () => {
  const base = { ...EMPTY_LISTING, title: " Кружка ", categoryId: CATEGORY, price: "2500" }

  it("sends only the fields of the type", () => {
    const service = listingRequest({ ...base, type: "SERVICE", durationText: "2 часа", inStock: false, leadTimeDays: "5" })
    const product = listingRequest({ ...base, type: "READY_PRODUCT", durationText: "2 часа", inStock: false, leadTimeDays: "5" })
    const order = listingRequest({ ...base, type: "MADE_TO_ORDER", durationText: "2 часа", inStock: false, leadTimeDays: "5" })

    expect(service).toMatchObject({ durationText: "2 часа" })
    expect(service).not.toHaveProperty("inStock")
    expect(service).not.toHaveProperty("leadTimeDays")
    expect(product).toMatchObject({ inStock: false })
    expect(product).not.toHaveProperty("durationText")
    expect(order).toMatchObject({ leadTimeDays: 5 })
    expect(order).not.toHaveProperty("inStock")
  })

  it("sends the price in kopecks, or none for 'by agreement'", () => {
    expect(listingRequest(base).priceFromMinor).toBe(250000)
    expect(listingRequest({ ...base, price: "" })).not.toHaveProperty("priceFromMinor")
  })

  it("trims the title, maps 'hidden' to the status and keeps the attributes it is given", () => {
    const request = listingRequest({ ...base, hidden: true }, { Объём: "300 мл" })

    expect(request).toMatchObject({ title: "Кружка", status: "HIDDEN", attributes: { Объём: "300 мл" } })
    expect(listingRequest(base)).toMatchObject({ status: "ACTIVE" })
    expect(listingRequest(base)).not.toHaveProperty("attributes")
  })
})

describe("listingValuesOf", () => {
  it("fills the form from a listing and gives back the same request", () => {
    const listing = {
      id: "l",
      type: "MADE_TO_ORDER",
      title: "Сервиз",
      description: "На шесть персон",
      category: { id: CATEGORY, slug: "ceramics", name: "Керамика" },
      priceFromMinor: 1500050,
      currency: "RUB",
      deliveryAvailable: true,
      leadTimeDays: 30,
      attributes: { Цвет: "синий" },
      status: "HIDDEN",
      reviewStatus: "APPROVED",
      photos: [],
      createdAt: "",
      updatedAt: "",
    } as MyListing

    const values = listingValuesOf(listing)

    expect(values).toMatchObject({ price: "15000,50", leadTimeDays: "30", hidden: true, type: "MADE_TO_ORDER" })
    expect(listingRequest(values, listing.attributes)).toEqual({
      title: "Сервиз",
      description: "На шесть персон",
      categoryId: CATEGORY,
      priceFromMinor: 1500050,
      deliveryAvailable: true,
      leadTimeDays: 30,
      attributes: { Цвет: "синий" },
      status: "HIDDEN",
    })
  })
})

describe("portfolioSchema", () => {
  it("wants a category, the title is optional", () => {
    expect(portfolioSchema.safeParse({ title: "", categoryId: CATEGORY, subcategoryId: "" }).success).toBe(true)
    expect(portfolioSchema.safeParse({ title: "Серия", categoryId: "", subcategoryId: "" }).success).toBe(false)
  })
})
