import { type APIRequestContext, type APIResponse, expect, request, type Page } from "@playwright/test"
import { type ImageFile, solidPng } from "./image"
import { linkTo, waitForMail } from "./mail"

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000"
export const PASSWORD = "correct horse battery staple"
/** The build number of the header `X-EGG-Client: web/<N>` is a number; the backend answers 403 to any other text. */
const WEB_CLIENT = "web/1"
/** The account that the backend makes an administrator (`EGG_BOOTSTRAP_ADMIN_EMAIL` of the backend that runs). */
export const ADMIN = { email: process.env.E2E_ADMIN_EMAIL ?? "admin@example.org", password: process.env.E2E_ADMIN_PASSWORD ?? PASSWORD }

export interface Person {
  email: string
  name: string
  password: string
}

let counter = 0
const stamp = Date.now().toString(36)

/** An address and a name that no other spec of this run uses. */
export function newPerson(prefix: string): Person {
  counter += 1
  return { email: `${prefix}-${stamp}-${counter}@example.org`, name: `${prefix} ${stamp}${counter}`, password: PASSWORD }
}

/** The API of the backend as one signed-in person, through the web client (`/api/v1`), the way a browser reaches it. */
export class Api {
  private constructor(
    private readonly context: APIRequestContext,
    private readonly cookie: string,
  ) {}

  static async anonymous(): Promise<Api> {
    return new Api(await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { "X-EGG-Client": WEB_CLIENT } }), "")
  }

  /** Signs in; the cookies are kept by hand because the session cookie is `Secure` and the stack runs on plain http. */
  static async login(email: string, password: string): Promise<Api> {
    const anonymous = await Api.anonymous()
    const response = await anonymous.context.post("/api/v1/auth/login", { data: { email, password } })
    expect(response.status(), `login of ${email}`).toBe(200)
    const cookie = response
      .headersArray()
      .filter((header) => header.name.toLowerCase() === "set-cookie")
      .map((header) => header.value.split(";")[0])
      .join("; ")
    return new Api(anonymous.context, cookie)
  }

  private headers(): Record<string, string> {
    return this.cookie ? { cookie: this.cookie } : {}
  }

  get(path: string): Promise<APIResponse> {
    return this.context.get(`/api/v1${path}`, { headers: this.headers() })
  }

  post(path: string, data?: unknown): Promise<APIResponse> {
    return this.context.post(`/api/v1${path}`, { headers: this.headers(), data })
  }

  put(path: string, data?: unknown): Promise<APIResponse> {
    return this.context.put(`/api/v1${path}`, { headers: this.headers(), data })
  }

  delete(path: string): Promise<APIResponse> {
    return this.context.delete(`/api/v1${path}`, { headers: this.headers() })
  }

  /** A call that must succeed; gives its body. */
  async ok<T>(response: Promise<APIResponse>, expected: number | number[] = [200, 201]): Promise<T> {
    const answer = await response
    const accepted = Array.isArray(expected) ? expected : [expected]
    expect(accepted, `${answer.url()} answered ${answer.status()}: ${await answer.text()}`).toContain(answer.status())
    return (answer.status() === 204 ? undefined : await answer.json()) as T
  }

  /** The upload as the browser sends it, with the answer left to the caller (for the limit of the size). */
  uploadRaw(file: ImageFile): Promise<APIResponse> {
    return this.context.post("/api/v1/media", {
      headers: this.headers(),
      multipart: { file: { name: file.name, mimeType: file.mimeType, buffer: file.buffer } },
    })
  }

  async upload(file: ImageFile): Promise<string> {
    const media = await this.ok<{ id: string }>(this.uploadRaw(file), 201)
    return media.id
  }

  dispose(): Promise<void> {
    return this.context.dispose()
  }
}

const SUBJECT_CONFIRM = /Подтвердите/

/** Registers a person through the API and confirms the address with the link of the mail, as the person would. */
export async function registerConfirmed(person: Person): Promise<void> {
  const anonymous = await Api.anonymous()
  await anonymous.ok(
    anonymous.post("/auth/register", { email: person.email, name: person.name, password: person.password, consentVersion: "e2e", adultConfirmed: true }),
    201,
  )
  const mail = await waitForMail(person.email, SUBJECT_CONFIRM)
  const token = new URL(linkTo(mail, "/verify-email")).searchParams.get("token")
  await anonymous.ok(anonymous.post("/auth/verify-email", { token }), 204)
  await anonymous.dispose()
}

/** The administrator: the account of the bootstrap address, registered and confirmed on the first run, signed in on every run. */
export async function adminApi(): Promise<Api> {
  const anonymous = await Api.anonymous()
  const attempt = await anonymous.post("/auth/login", { email: ADMIN.email, password: ADMIN.password })
  await anonymous.dispose()
  if (attempt.status() !== 200) await registerConfirmed({ email: ADMIN.email, name: "Админ", password: ADMIN.password })
  return Api.login(ADMIN.email, ADMIN.password)
}

export interface Creator {
  person: Person
  creatorId: string
  displayName: string
  listingTitle: string
  api: Api
}

export interface CreatorOptions {
  /** Send the showcase to review (needs the minimum). */
  submit?: boolean
  /** Approve it as the administrator (implies `submit`). */
  publish?: boolean
}

interface Category {
  id: string
  name: string
}

/** A creator with the minimum of a showcase (a name, a category, a listing with a photo, three works), filled through the API. */
export async function prepareCreator(prefix: string, options: CreatorOptions = {}): Promise<Creator> {
  const person = newPerson(prefix)
  await registerConfirmed(person)
  const api = await Api.login(person.email, person.password)
  const categories = await api.ok<{ items: Category[] }>(api.get("/categories"))
  const category = categories.items[0]
  expect(category).toBeDefined()
  const displayName = `Мастерская ${person.name}`
  const listingTitle = `Кружка ${person.name}`
  await api.ok(api.post("/me/creator-profile", {}), 201)
  const profile = await api.ok<{ id: string }>(
    api.put("/me/creator-profile", { displayName, bio: "Посуда на гончарном круге.", categoryId: category!.id, tags: ["кружки", "ручная работа"] }),
  )
  const listing = await api.ok<{ id: string }>(
    api.post("/me/listings", { type: "READY_PRODUCT", title: listingTitle, description: "Гончарная кружка.", categoryId: category!.id, priceFromMinor: 250000, deliveryAvailable: false, inStock: true }),
    201,
  )
  await api.ok(api.post(`/me/listings/${listing.id}/photos`, { mediaId: await api.upload(solidPng("listing", [47, 111, 143])) }), 201)
  for (const [index, color] of ([[143, 47, 79], [79, 143, 47], [143, 111, 47]] as [number, number, number][]).entries()) {
    await api.ok(api.post("/me/portfolio-items", { mediaId: await api.upload(solidPng(`work${index}`, color)), categoryId: category!.id }), 201)
  }
  const creator: Creator = { person, creatorId: profile.id, displayName, listingTitle, api }
  if (options.publish) await publishCreator(creator)
  else if (options.submit) await api.ok(api.post("/me/creator-profile/submit"), 200)
  return creator
}

/** Sends the showcase to review and approves it, content and all, as the administrator. */
export async function publishCreator(creator: Creator): Promise<void> {
  await creator.api.ok(creator.api.post("/me/creator-profile/submit"), 200)
  const admin = await adminApi()
  await admin.ok(admin.post(`/admin/creators/${creator.creatorId}/content/approve`), 204)
  await admin.ok(admin.post(`/admin/creators/${creator.creatorId}/approve`), 200)
  await admin.dispose()
}

/** Signs in through the login page, the way a person does, and waits until the page they asked for is open. */
export async function signIn(page: Page, person: Pick<Person, "email" | "password">, returnTo = "/"): Promise<void> {
  await page.goto(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  await page.getByLabel("Почта").fill(person.email)
  await page.getByLabel("Пароль").fill(person.password)
  await page.getByRole("button", { name: "Войти" }).click()
  await page.waitForURL((url) => url.pathname === new URL(returnTo, BASE_URL).pathname)
}

/** Whether the backend that runs has the messaging switched on (`features.messaging`). */
export async function messagingIsOn(): Promise<boolean> {
  const anonymous = await Api.anonymous()
  const versions = await anonymous.ok<{ features: { messaging: boolean } }>(anonymous.get("/meta/client-versions"))
  await anonymous.dispose()
  return versions.features.messaging
}
