import { MenuScreen } from "@/components/menu/menu-screen";
import { getSessionWithSnapshot } from "@/lib/app/session";
import { loadMainAppSnapshot } from "@/lib/app/main-app";

export default async function MenuPage() {
  let snapshot = loadMainAppSnapshot({});
  
  if (process.env.BYPASS_MAIN_APP_GUARD !== 'true') {
    const context = await getSessionWithSnapshot().catch(() => null);
    if (context) {
      snapshot = context.snapshot;
    }
  }

  return <MenuScreen snapshot={snapshot} />;
}
