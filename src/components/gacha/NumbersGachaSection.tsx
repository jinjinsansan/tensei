"use client";

import { useState } from "react";

import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";
import { NumbersGachaPlayer } from "@/components/gacha/NumbersGachaPlayer";

export function NumbersGachaButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <RoundMetalButton
        label={"ナンバーズ\nガチャ"}
        subLabel="START"
        onClick={() => setOpen(true)}
        className="mx-auto"
      />
      {open && <NumbersGachaPlayer open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
