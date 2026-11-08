import type { components } from "./schema"

export type ProblemDetail = components["schemas"]["ProblemDetail"]
export type FieldError = components["schemas"]["FieldError"]

/** An answer of the API that is an error: the HTTP status and, when the body is a problem document, its stable code. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly problem: ProblemDetail | null

  constructor(status: number, problem: ProblemDetail | null) {
    super(problem?.title ?? `HTTP ${status}`)
    this.name = "ApiError"
    this.status = status
    this.code = problem?.code ?? `HTTP_${status}`
    this.problem = problem
  }
}

/** Whether a response body is a `ProblemDetail`: clients branch on `code`, never on `title`. */
export function isProblemDetail(value: unknown): value is ProblemDetail {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.code === "string" && typeof candidate.status === "number" && typeof candidate.title === "string"
}

export function toApiError(status: number, body: unknown): ApiError {
  return new ApiError(status, isProblemDetail(body) ? body : null)
}

// What a person is told for the codes they can meet. A code that is not here gets the general text of its status.
const MESSAGES: Record<string, string> = {
  VALIDATION_FAILED: "Проверьте введённые данные.",
  INVALID_CREDENTIALS: "Неверная почта или пароль.",
  ACCOUNT_SUSPENDED: "Аккаунт приостановлен.",
  EMAIL_TAKEN: "Этот адрес уже зарегистрирован.",
  EMAIL_NOT_VERIFIED: "Подтвердите адрес почты.",
  EMAIL_ALREADY_VERIFIED: "Адрес уже подтверждён.",
  TOKEN_INVALID: "Ссылка недействительна или устарела.",
  UNSUBSCRIBE_TOKEN_INVALID: "Ссылка для отписки недействительна.",
  OWNER_NOT_ACTIVE: "Аккаунт владельца витрины не активен.",
  CONTENT_NOT_PENDING: "Этот материал уже не ждёт проверки. Обновите страницу.",
  RATE_LIMITED: "Слишком много попыток. Попробуйте чуть позже.",
  CLIENT_UPGRADE_REQUIRED: "Обновите страницу.",
  SERVICE_BUSY: "Сервис занят. Попробуйте ещё раз через минуту.",
  UNAUTHENTICATED: "Нужно войти.",
  FORBIDDEN: "Недостаточно прав.",
  NOT_FOUND: "Не найдено.",
  CREATOR_PROFILE_EXISTS: "Витрина уже создана.",
  SHOWCASE_MINIMUM_VIOLATION: "Нельзя убрать то, без чего витрина не может быть опубликована.",
  SHOWCASE_MINIMUM_NOT_MET: "Витрина ещё не готова к отправке на проверку.",
  INVALID_SHOWCASE_STATE: "В этом состоянии витрины действие недоступно.",
  LISTING_PHOTO_LIMIT: "У позиции уже максимум фотографий.",
  PORTFOLIO_ORDER_MISMATCH: "Порядок не совпал с вашими работами. Обновите страницу.",
  CANNOT_MESSAGE_SELF: "Нельзя написать самому себе.",
  COUNTERPART_DELETED: "Собеседник удалил аккаунт, писать ему больше нельзя.",
  CANNOT_SUSPEND_ADMIN: "Администратора нельзя приостановить.",
  IMAGE_TOO_LARGE: "Изображение слишком большое.",
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "Проверьте введённые данные.",
  401: "Нужно войти.",
  403: "Недостаточно прав.",
  404: "Не найдено.",
  409: "Действие сейчас недоступно.",
  413: "Файл слишком большой.",
  415: "Этот тип файла не подходит.",
  422: "Действие не выполнено.",
  426: "Обновите страницу.",
  429: "Слишком много попыток. Попробуйте чуть позже.",
  503: "Сервис занят. Попробуйте ещё раз через минуту.",
}

const GENERAL_MESSAGE = "Что-то пошло не так. Попробуйте ещё раз."

/** The text for a person: by the code, else by the status, else a general one. Never the `title` or `detail` of the server. */
export function messageOf(error: ApiError): string {
  return MESSAGES[error.code] ?? STATUS_MESSAGES[error.status] ?? GENERAL_MESSAGE
}

/** The text for a person for any failure of a call: an `ApiError` by its code, anything else (the network, a bug) in general words. */
export function errorTextOf(error: unknown): string {
  return error instanceof ApiError ? messageOf(error) : GENERAL_MESSAGE
}

// What a person is told for the codes of a single field (`errors[].code` of a `VALIDATION_FAILED` answer).
const FIELD_MESSAGES: Record<string, string> = {
  REQUIRED: "Обязательное поле.",
  BLANK: "Поле не может быть пустым.",
  INVALID_FORMAT: "Неверный формат.",
  INVALID_SIZE: "Недопустимая длина.",
  OUT_OF_RANGE: "Значение вне допустимых пределов.",
  INVALID_CHARACTERS: "В тексте есть недопустимые символы.",
  COMMON_PASSWORD: "Этот пароль слишком распространён. Придумайте другой.",
}

const GENERAL_FIELD_MESSAGE = "Недопустимое значение."

/** The per-field errors of a `VALIDATION_FAILED` answer by the path of the field, for the forms: by code, never the text of the server. */
export function fieldErrorsOf(error: ApiError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const item of error.problem?.errors ?? []) {
    result[item.field] = FIELD_MESSAGES[item.code] ?? GENERAL_FIELD_MESSAGE
  }
  return result
}
