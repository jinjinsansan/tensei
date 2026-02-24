"use client";

import { useState } from "react";

import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";
import { HarakiriGachaPlayer } from "@/components/gacha/HarakiriGachaPlayer";

export function HarakiriGachaButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <RoundMetalButton
        label={"VVV\nガチャ"}
        subLabel="START"
        onClick={() => setOpen(true)}
        className="mx-auto"
      />
      {open && <HarakiriGachaPlayer open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
