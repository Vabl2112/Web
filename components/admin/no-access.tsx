import { FormAlert } from "@/components/auth/form-alert"

/**
 * What a page of the administration shows when the API answers `403`. The page itself does not know who is an administrator: the API
 * decides on every call (AC-40 (б)), and this is its answer in words.
 */
export function NoAccess() {
  return <FormAlert message="У вас нет доступа к этой странице." />
}
