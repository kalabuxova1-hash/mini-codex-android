import { redirect } from "next/navigation";
import { chatGPTSignInPath } from "./chatgpt-auth";
import { ownerId, agentState } from "../lib/phone-relay";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (!await ownerId()) redirect(chatGPTSignInPath("/"));
  const state = await agentState();
  return <main className="phone-panel">
    <p className="eyebrow">Личный инструмент</p>
    <h1>Мини Codex</h1>
    <p className="intro">Управление твоим телефоном из ChatGPT.</p>
    <section className="phone-card" aria-labelledby="connection">
      <h2 id="connection">Телефон</h2>
      <p className={state.online ? "online" : "pending"}>{state.online ? "Агент подключён" : "Ожидаем подключение агента"}</p>
      <p>Команды выполняются на самом телефоне. После проверки подключения компьютер можно отключить.</p>
    </section>
    <section className="phone-card" aria-labelledby="memory">
      <h2 id="memory">Память задач</h2>
      <p>Краткие заметки и сжатые архивы — вместе до 5 ГБ. Место заполняется постепенно; самые старые записи удаляются при достижении лимита.</p>
      <p>В памяти сохраняются предпочтения и проверенные способы выполнения задач.</p>
    </section>
    <section className="phone-card" aria-labelledby="chatgpt">
      <h2 id="chatgpt">Подключение к ChatGPT</h2>
      <p>Добавь личный плагин «Мини Codex — телефон» и выбери его в разговоре. Начни с команды «Проверь состояние моего телефона».</p>
      <a className="phone-button" href="https://chatgpt.com/plugins" target="_top">Открыть плагины ChatGPT</a>
    </section>
    <p className="footnote">Доступ закреплён за твоим аккаунтом. Агент можно остановить, отключив модуль «Мини Codex» в Magisk.</p>
  </main>;
}
