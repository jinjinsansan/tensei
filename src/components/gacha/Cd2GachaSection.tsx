"use client";

import { useState } from "react";

import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";
import { Cd2GachaPlayer } from "@/components/gacha/Cd2GachaPlayer";

export function Cd2GachaButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <RoundMetalButton
        label={"カウントダウン\nチャレンジ２"}
        subLabel="START"
        onClick={() => setOpen(true)}
        className="mx-auto"
        labelClassName="text-xs tracking-[0.05em]"
      />
      {open && <Cd2GachaPlayer open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
