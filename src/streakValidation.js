import { initDB } from "./progress";
export async function validateStreak(serverDate) {
  const db = await initDB();
  const tx = db.transaction("userStats", "readwrite");
  const store = tx.objectStore("userStats");

  const stats = await store.get("stats");
  if (!stats || !stats.lastEnthalpyDate) {
    await tx.done;
    return;
  }

  const today = new Date(serverDate);
  const last = new Date(stats.lastEnthalpyDate);

  // poner horas a 0 para comparar solo el día
  today.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today - last) / 86400000);

  if (diffDays >= 2) {
    await store.put({
      ...stats,
      enthalpy: 0,
      lastEnthalpyDate: null,
    });
  }

  await tx.done;
}
