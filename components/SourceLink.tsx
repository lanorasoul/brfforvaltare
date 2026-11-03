import { ExternalIcon } from "./icons";
import { dateLong } from "@/lib/format";

/** Länk till källan med datum för när vi läste den. Öppnas i ny flik. */
export function SourceLink({ url, checked, label = "Källa" }: { url: string; checked: string; label?: string }) {
  return (
    <a className="link" href={url} target="_blank" rel="noopener noreferrer">
      {label}, läst {dateLong(checked)}
      <ExternalIcon />
    </a>
  );
}
