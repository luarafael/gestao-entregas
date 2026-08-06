# Onboarding — Primeiro dia

Material de treinamento para novos clientes (Fase 2).

| Entregável | Arquivo | Status |
|------------|---------|--------|
| Roteiro do vídeo (5–10 min) | [onboarding-roteiro.md](./onboarding-roteiro.md) | ✅ Pronto para gravar |
| Guia rápido (1 página) | [guia-rapido-cliente.md](./guia-rapido-cliente.md) | ✅ Pronto (exportar PDF se quiser) |
| Vídeo gravado | Link Loom/YouTube | ⬜ Gravar seguindo o roteiro |

**Documentos relacionados:** [Deploy por cliente](./deploy-cliente.md) · [Backup](./backup.md)

---

## Como gravar o vídeo

### Ferramenta recomendada

- [Loom](https://www.loom.com) (grátis até 25 vídeos) ou OBS + upload no YouTube (não listado)
- Resolução: **1920×1080** ou 1280×720
- Microfone limpo; ambiente silencioso
- Grave a tela do **frontend em produção** (ou ambiente de homologação com dados de exemplo)

### Antes de gravar

- [ ] Ambiente com logo e nome do cliente já configurados (`VITE_APP_NAME`)
- [ ] 3–5 entregas de exemplo no dia atual
- [ ] 1 pendência aberta
- [ ] Usuário **Admin** e **Motoboy** criados (para mostrar menus diferentes, se quiser)
- [ ] Roteiro aberto em segunda tela: [onboarding-roteiro.md](./onboarding-roteiro.md)
- [ ] Fechar abas e notificações do sistema

### Dicas de gravação

1. Fale devagar e mostre o clique **antes** de executar a ação
2. Use o cursor para destacar botões importantes
3. Se errar, pause 2 segundos e repita o trecho — edite depois no Loom
4. No Loom, adicione **capítulos** nos timestamps do roteiro

### Depois de gravar

1. Revisar áudio e cortar pausas longas
2. Título sugerido: `Gestão de Entregas — Primeiro dia`
3. Descrição: incluir URL do sistema + link do guia rápido
4. Salvar link permanente no cadastro do cliente

---

## Entrega ao cliente

Enviar no WhatsApp ou e-mail de boas-vindas:

```
Olá! Segue o material de início:

📱 Acesso: [URL do sistema]
👤 Login: [e-mail]
🔑 Senha temporária: [senha] — troque no primeiro acesso

🎬 Vídeo "Primeiro dia": [link Loom]
📄 Guia rápido: [link ou PDF anexo]

Dúvidas? Responda esta mensagem ou agende o treinamento ao vivo (15 min).
```

### Checklist de entrega

```
[ ] URL do sistema testada
[ ] Credenciais enviadas por canal seguro
[ ] Vídeo gravado e link enviado
[ ] Guia rápido enviado (PDF ou link)
[ ] Instrução PWA enviada (instalar no celular)
[ ] Treinamento ao vivo agendado (opcional, recomendado)
[ ] Follow-up em 7 dias
```

---

## Versões do vídeo

| Público | Duração | O que incluir |
|---------|---------|---------------|
| **Admin** (completo) | 8–10 min | Tudo no roteiro |
| **Motoboy** (resumido) | 4–5 min | Login, PWA, Entregas, Planejador |
| **Homologação** | 3 min | Só fluxo que o cliente vai assinar no checklist |

Para o vídeo resumido do Motoboy, grave apenas os blocos marcados no roteiro.

---

*Última atualização: Agosto/2026*
