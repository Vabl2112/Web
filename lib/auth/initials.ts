/** The letter in the round avatar of an account: the first letter of its name, or `?` for a name without letters. */
export function initialsOf(name: string): string {
  const letter = Array.from(name.trim()).find((char) => /\p{L}/u.test(char))
  return letter ? letter.toLocaleUpperCase("ru-RU") : "?"
}
