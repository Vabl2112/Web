import { Alert, AlertDescription } from "@/components/ui/alert"

interface FormAlertProps {
  message: string
  /** `error` for a failure of the form, `info` for a result that is not one. */
  tone?: "error" | "info"
}

export function FormAlert({ message, tone = "error" }: FormAlertProps) {
  return (
    <Alert variant={tone === "error" ? "destructive" : "default"} role={tone === "error" ? "alert" : "status"}>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
