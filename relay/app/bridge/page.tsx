import { requireChatGPTUser } from "../chatgpt-auth";
import { pairingLink } from "@/lib/pc-relay";
export const dynamic = "force-dynamic";
export default async function Pairing({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const id = (await searchParams).id || "";
  const user = await requireChatGPTUser("/bridge?id=" + encodeURIComponent(id));
  const link = await pairingLink(id, user);
  if (!link) return <main><h1>Mini Codex — подключение ПК</h1><p>Приглашение недоступно. Сначала запустите pair на ПК и войдите с указанной в приглашении почтой ChatGPT.</p></main>;
  if (link.state === "active") return <main className="phone-panel"><h1>Подключение к ПК сохранено</h1>
    <p>Аккаунт: {user.email}. Компьютер: {link.label}.</p>
    <p>Отпечаток ПК:</p><pre>{link.token_hash}</pre>
    <p>Разрешения ПК: {JSON.parse(link.capabilities).join(", ") || "только статус"}.</p>
    <p>Обратный доступ к телефону: {link.phone_access ? "разрешён владельцем телефона" : "выключен"}.</p>
    <p>Завершите activate на ПК. Сопряжение сохраняется между запусками; для выполнения задания нужное устройство должно быть в сети.</p>
  </main>;
  return <main className="phone-panel"><h1>Разрешить подключение к ПК?</h1>
    <p>Аккаунт: {user.email}. Компьютер: {link.label}.</p>
    <p>Сравните этот отпечаток с отпечатком в терминале вашего ПК:</p><pre>{link.token_hash}</pre>
    <p>Приглашающий аккаунт: {link.inviter}</p>
    <p>Разрешения ПК: {JSON.parse(link.capabilities).join(", ") || "только статус"}.</p>
    <p>Терминал даёт полный доступ с правами Windows-пользователя. Ограничения папок относятся к файловым инструментам; команды PowerShell ими не изолируются.</p>
    <p>Обратный доступ к телефону: {link.phone_access ? "разрешён владельцем телефона" : "выключен"}.</p>
    <p>Computer Use и Sites используют собственные разрешения плагинов. Это сопряжение их не включает.</p>
    <form action="/bridge/approve" method="post"><input type="hidden" name="id" value={link.id}/><input type="hidden" name="fingerprint" value={link.token_hash || ""}/><button type="submit">Разрешить именно этому ПК</button></form>
  </main>;
}
