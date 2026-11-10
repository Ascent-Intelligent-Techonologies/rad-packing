"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-outline !min-h-[40px] !px-4 text-sm">
      <Printer size={16} /> Print / Save as PDF
    </button>
  );
}
