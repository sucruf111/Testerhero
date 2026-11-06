"use client";

import { useEffect, useRef, useState } from "react";

/** Markiert alle Checkboxen, die per form-Attribut zum Sammelformular gehören */
export function SelectAll({ formId }: { formId: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const boxes = () => Array.from(document.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name=ids][form="${formId}"]`));
    const update = () => {
      const all = boxes();
      const checked = all.filter((b) => b.checked).length;
      setSelected(checked);
      if (ref.current) {
        ref.current.checked = all.length > 0 && checked === all.length;
        ref.current.indeterminate = checked > 0 && checked < all.length;
      }
    };
    document.addEventListener("change", update);
    update();
    return () => document.removeEventListener("change", update);
  }, [formId]);

  return (
    <label className="mr-2 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
      <input
        ref={ref}
        type="checkbox"
        aria-label="Alle markieren"
        className="checkbox-check size-5 cursor-pointer rounded-md bg-white ring-1 ring-line checked:bg-coral-500 checked:ring-coral-500 indeterminate:bg-coral-300"
        onChange={(e) => {
          document
            .querySelectorAll<HTMLInputElement>(`input[type=checkbox][name=ids][form="${formId}"]`)
            .forEach((b) => (b.checked = e.target.checked));
          setSelected(e.target.checked ? document.querySelectorAll(`input[type=checkbox][name=ids][form="${formId}"]`).length : 0);
        }}
      />
      {selected > 0 ? `${selected} markiert` : "Alle"}
    </label>
  );
}
