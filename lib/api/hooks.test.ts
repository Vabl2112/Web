import { describe, expect, it } from "vitest"
import { ApiError } from "./errors"
import { unwrap } from "./hooks"

const answer = (status: number, body: unknown) => ({
  data: status < 400 ? body : undefined,
  error: status >= 400 ? body : undefined,
  response: new Response(null, { status }),
})

describe("unwrap", () => {
  it("gives the data of a successful answer", async () => {
    await expect(unwrap(Promise.resolve(answer(200, { id: 1 })))).resolves.toEqual({ id: 1 })
  })

  it("throws an ApiError with the code of the problem document", async () => {
    const body = { title: "t", status: 409, code: "EMAIL_TAKEN" }

    await expect(unwrap(Promise.resolve(answer(409, body)))).rejects.toMatchObject({ status: 409, code: "EMAIL_TAKEN" })
  })

  it("throws an ApiError with a code from the status when the body is not a problem document", async () => {
    const failure = unwrap(Promise.resolve(answer(502, "bad gateway")))

    await expect(failure).rejects.toBeInstanceOf(ApiError)
    await expect(failure).rejects.toMatchObject({ code: "HTTP_502" })
  })
})
