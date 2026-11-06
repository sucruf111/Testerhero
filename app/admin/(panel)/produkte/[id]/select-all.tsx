"use client";

import { useEffect, useRef, useState } from "react";

/** Markiert alle Checkboxen, die per form-Attribut zum Sammelformular gehören */
export function SelectAll({ formId }: { formId: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);
  const selector = `input[type=checkbox][name=ids][form="${formId}"]`;

  useEffect(() => {
    const update = () => {
      const all = Array.from(document.querySelectorAll<HTMLInputElement>(selector));
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
  }, [selector]);

  return (
    <label className="mr-1 inline-flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
      <input
        ref={ref}
        type="checkbox"
        aria-label="Alle markieren"
        className="checkbox-check size-[18px] cursor-pointer rounded-[5px] border border-ink/25 bg-white checked:border-coral-500 checked:bg-coral-500 indeterminate:bg-coral-300"
        onChange={(e) => {
          const boxes = document.querySelectorAll<HTMLInputElement>(selector);
          boxes.forEach((b) => (b.checked = e.target.checked));
          setSelected(e.target.checked ? boxes.length : 0);
        }}
      />
      {selected > 0 ? `${selected} markiert` : "Alle"}
    </label>
  );
}
