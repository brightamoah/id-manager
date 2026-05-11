export function generateInitials(name: string) {
  const namesArray = name.trim().split(" ").filter(n => n.length > 0);
  if (namesArray.length === 0) return "";

  if (namesArray.length === 1) {
    const singleName = namesArray[0];
    if (typeof singleName === "string" && singleName.length >= 2) {
      return singleName.charAt(0).toUpperCase() + singleName.charAt(1).toUpperCase();
    }

    return typeof singleName === "string" && singleName.length > 0 ? singleName.charAt(0).toUpperCase() : "";
  }

  const firstName = namesArray[0];
  const firstInitial = typeof firstName === "string" && firstName.length > 0 ? firstName.charAt(0).toUpperCase() : "";
  const lastName = namesArray.at(-1);
  const lastInitial = typeof lastName === "string" && lastName.length > 0 ? lastName.charAt(0).toUpperCase() : "";
  return firstInitial + lastInitial;
}
