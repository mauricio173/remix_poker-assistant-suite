# 🎰 Guia de Deploy - Poker Assistant Suite no GitHub Pages

## Resumo Rápido
Este app Poker Assistant Suite pode ser rodado diretamente no **GitHub Pages** mantendo todas as suas funcionalidades. Siga os passos abaixo:

---

## ✅ Opção 1: Deploy Rápido (Frontend Only) - Recomendado

### O que você precisa:
- GitHub account
- Git instalado localmente
- Seu repositório na forma `seu-usuario/remix_-poker-assistant-suite`

### Passos:

#### 1️⃣ Crie o repositório no GitHub
- Vá para [github.com/new](https://github.com/new)
- Nome: `remix_-poker-assistant-suite`
- Deixe público e clique "Create repository"

#### 2️⃣ Faça push do seu código
```bash
cd c:\Users\Win10\Downloads\Poker\remix_-poker-assistant-suite

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/remix_-poker-assistant-suite.git
git push -u origin main
```

#### 3️⃣ Configure GitHub Pages
- Vá em **Settings** → **Pages** do seu repositório
- Source: **GitHub Actions**
- Pronto! O GitHub Actions vai fazer deploy automaticamente

#### 4️⃣ Acesse seu app
Seu app estará disponível em:
```
https://seu-usuario.github.io/remix_-poker-assistant-suite/
```

**Tempo de deploy:** ~2-3 minutos. Verifique em **Actions** para ver o progresso.

---

## 🚀 Opção 2: Com Backend (Análise com Gemini AI)

Se você quer usar o recurso de análise com IA Gemini, siga TAMBÉM estes passos:

### Backend no Vercel (Gratuito)

#### 1️⃣ Obtenha sua chave do Gemini
- Vá para [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
- Copie sua chave

#### 2️⃣ Faça deploy no Vercel
```bash
npm i -g vercel
vercel
# Escolha seu projeto
# Quando pedir GEMINI_API_KEY, cole o valor que copiou
```

Você receberá uma URL como: `https://seu-projeto.vercel.app`

#### 3️⃣ Configure o frontend
Atualize a chamada da API nos componentes para usar:
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'https://seu-projeto.vercel.app';
```

---

## 📊 O que está funcionando?

✅ **Funciona 100% no GitHub Pages:**
- GTO Solver com matriz de ranges
- HUD de oponentes
- Análise local de mãos (sem IA)
- PokerStars parser
- Poker Math utilities
- Interface Tailwind CSS

⚠️ **Requer backend (Vercel):**
- Análise com Gemini AI
- Endpoints `/api/analyze-hand`

---

## 🆘 Troubleshooting

### ❌ "Failed to load assets" 
**Solução:** Verifique se o `base` em `vite.config.ts` está correto:
```typescript
base: '/remix_-poker-assistant-suite/',
```

### ❌ "GitHub Actions não faz deploy"
**Solução:** Verifique em **Settings** → **Actions** → **General**:
- Ensure "Allow all actions and reusable workflows" está ativado

### ❌ API não conecta
**Solução:** Adicione CORS no seu Vercel backend:
```typescript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

---

## 📝 Comandos Úteis

```bash
# Build local
npm run build

# Servir build local
npm run start

# Verificar erros TypeScript
npm run lint

# Desenvolvimento local
npm run dev
```

---

## 🎯 Resumo Final

| Aspecto | GitHub Pages | Vercel Backend |
|--------|------------|------------------|
| **Custo** | Gratuito | Gratuito |
| **Setup** | 5 minutos | 10 minutos |
| **Funcionalidades** | Tudo (sem IA) | Tudo + IA Gemini |
| **Performance** | Excelente | Excelente |
| **Escalabilidade** | Sim | Sim |

**Recomendação:** Comece com a **Opção 1** (GitHub Pages only). Se precisar de IA, adicione o Vercel depois.
