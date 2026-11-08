import { describe, expect, it } from "vitest"
import { ApiError, errorTextOf, fieldErrorsOf, isProblemDetail, messageOf, toApiError } from "./errors"

const problem = (overrides: Record<string, unknown> = {}) => ({
  title: "Server title that a person must never see",
  status: 422,
  code: "CANNOT_SUSPEND_ADMIN",
  detail: "Server detail that a person must never see",
  ...overrides,
})

describe("toApiError", () => {
  it("keeps the status and the stable code of a problem document", () => {
    const error = toApiError(422, problem())

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.code).toBe("CANNOT_SUSPEND_ADMIN")
    expect(error.problem?.status).toBe(422)
  })

  it("takes a code from the status when the body is not a problem document", () => {
    expect(toApiError(502, "<html>bad gateway</html>").code).toBe("HTTP_502")
    expect(toApiError(500, undefined).code).toBe("HTTP_500")
    expect(toApiError(500, { code: 5 }).problem).toBeNull()
  })
})

describe("isProblemDetail", () => {
  it("needs a code, a status and a title", () => {
    expect(isProblemDetail(problem())).toBe(true)
    expect(isProblemDetail({ code: "X", status: 400 })).toBe(false)
    expect(isProblemDetail(null)).toBe(false)
    expect(isProblemDetail("text")).toBe(false)
  })
})

describe("messageOf", () => {
  it("speaks by the code first", () => {
    expect(messageOf(toApiError(401, problem({ status: 401, code: "INVALID_CREDENTIALS" })))).toBe("Неверная почта или пароль.")
  })

  it("tells that a deleted counterpart cannot be written to", () => {
    expect(messageOf(toApiError(409, problem({ status: 409, code: "COUNTERPART_DELETED" })))).toBe(
      "Собеседник удалил аккаунт, писать ему больше нельзя.",
    )
  })

  it("never shows the title or the detail of the server", () => {
    const text = messageOf(toApiError(422, problem()))

    expect(text).toBe("Администратора нельзя приостановить.")
    expect(text).not.toContain("Server")
  })

  it("falls back to the status for a code it does not know", () => {
    expect(messageOf(toApiError(404, problem({ status: 404, code: "SOMETHING_NEW" })))).toBe("Не найдено.")
    expect(messageOf(toApiError(429, undefined))).toBe("Слишком много попыток. Попробуйте чуть позже.")
  })

  it("has a general text for the rest", () => {
    expect(messageOf(toApiError(500, undefined))).toBe("Что-то пошло не так. Попробуйте ещё раз.")
  })
})

describe("errorTextOf", () => {
  it("speaks by the code for an ApiError and in general words for anything else", () => {
    expect(errorTextOf(toApiError(409, problem({ status: 409, code: "EMAIL_TAKEN" })))).toBe("Этот адрес уже зарегистрирован.")
    expect(errorTextOf(new TypeError("Failed to fetch"))).toBe("Что-то пошло не так. Попробуйте ещё раз.")
  })
})

describe("fieldErrorsOf", () => {
  it("maps the fields of a validation answer by their codes, never by the text of the server", () => {
    const error = toApiError(
      400,
      problem({
        status: 400,
        code: "VALIDATION_FAILED",
        errors: [
          { field: "email", code: "INVALID_FORMAT", message: "Server text" },
          { field: "password", code: "COMMON_PASSWORD" },
          { field: "name", code: "SOMETHING_NEW" },
        ],
      }),
    )

    expect(fieldErrorsOf(error)).toEqual({
      email: "Неверный формат.",
      password: "Этот пароль слишком распространён. Придумайте другой.",
      name: "Недопустимое значение.",
    })
  })

  it("is empty when the answer has no field errors", () => {
    expect(fieldErrorsOf(toApiError(500, undefined))).toEqual({})
  })
})
