# Só Hoje

MVP de um app minimalista para definir até 3 prioridades do dia, marcar como concluídas e reiniciar automaticamente a cada novo dia.

## Como rodar localmente (Windows)

No PowerShell:

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Build e produção (Windows)

```bash
npm run build
npm start
```

## Testar PWA e offline

1. Gere o build e rode o servidor de produção:

```bash
npm run build
npm start
```

2. Acesse `http://localhost:3000` no navegador.
3. Abra o DevTools → Application → Service Workers para verificar o registro.
4. Ainda no DevTools, vá em Application → Storage e verifique o cache.
5. Para testar offline, abra DevTools → Network → marque **Offline** e recarregue a página.

> Observação: o service worker e o cache offline só são ativados em produção.
