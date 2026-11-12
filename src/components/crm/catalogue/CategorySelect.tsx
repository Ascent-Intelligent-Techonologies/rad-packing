export type CategoryOption = { id: string; name: string; depth: number; published: boolean };

const label = (o: CategoryOption) => `${"   ".repeat(o.depth)}${o.depth ? "– " : ""}${o.name}${o.published ? "" : " (draft)"}`;

/** A <select> listing categories as an indented tree. Uncontrolled, so it works in server and client components. */
export function CategorySelect({
  options,
  placeholder,
  ...props
}: { options: CategoryOption[]; placeholder?: string } & Omit<React.ComponentProps<"select">, "children">) {
  return (
    <select {...props} className={props.className ?? "field-sm"}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {label(o)}
        </option>
      ))}
    </select>
  );
}
