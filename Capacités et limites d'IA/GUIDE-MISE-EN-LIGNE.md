# 🚀 Mettre ton Studio de Création en ligne

Ce guide te fait passer de « ça marche dans l'aperçu » à **« mon studio est en ligne, mes clientes y accèdent seules avec leur e-mail, et la limite de 10 créations est vraiment infranchissable »** — avec ta clé API **cachée et protégée**.

⏱️ Compte ~40 minutes la première fois. Aucune ligne de code à écrire.

---

## 🧠 Comment ça marche (en 1 minute)

Trois briques travaillent ensemble :

```
Ta cliente entre son e-mail
        │
        ▼
Ton studio (page web)  →  Mini-serveur 🔒 (garde ta clé)  →  Claude (l'IA)
        │
        ▼
Base de données 🗄️ (compte les créations PAR e-mail → limite stricte)
```

- Ta **clé Anthropic** reste cachée dans le serveur (jamais dans la page).
- Le **compteur de 10 créations** est rangé côté serveur, **par e-mail** → vider le navigateur ou changer d'appareil ne remet rien à zéro. C'est ça, l'infranchissable.

---

## 📦 Les fichiers (déjà prêts dans ce projet)

| Fichier | Rôle |
|---|---|
| `Module IA.dc.html` | Ton studio (la page que voient tes clientes) |
| `support.js` | Le moteur d'affichage (ne pas y toucher) |
| `api/claude.js` | Mini-serveur : cache ta clé + compte par e-mail |
| `api/usage.js` | Page admin privée : voir / débloquer une cliente |
| `vercel.json` | Config (ton adresse « / » ouvre le studio) |

➡️ Télécharge le projet complet (bouton de téléchargement), tu obtiens un dossier avec tous ces fichiers (dont le dossier `api`).

---

## Étape 1 — Mettre les fichiers sur GitHub

1. Crée un compte gratuit sur **https://github.com**.
2. **+** en haut à droite → **New repository**. Nomme-le `studio-top-depart` → **Create repository**.
3. **« uploading an existing file »** → **glisse-dépose TOUS les fichiers** (en gardant le dossier `api` avec `claude.js` ET `usage.js` dedans) → **Commit changes**.

> 💡 Tu dois voir : `Module IA.dc.html`, `support.js`, `vercel.json`, et un dossier `api` contenant **deux** fichiers (`claude.js`, `usage.js`).

---

## Étape 2 — Déployer avec Vercel (gratuit)

1. **https://vercel.com** → **Sign up** → **« Continue with GitHub »**.
2. **Add New… → Project** → importe `studio-top-depart`.
3. **⚠️ Avant Deploy**, ajoute tes variables (Étape 3) — sinon clique Deploy puis ajoute-les après dans **Settings → Environment Variables** (et redéploie).

---

## Étape 3 — Tes variables (clé + réglages 🔒)

Dans **Settings → Environment Variables**, ajoute :

| Name | Value | Obligatoire ? |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-…` ← **ta clé** | ✅ Oui |
| `USAGE_LIMIT` | `10` | Optionnel (défaut : 10) |
| `ADMIN_SECRET` | un mot de passe que tu inventes | ✅ pour la page admin |
| `ANTHROPIC_MODEL` | `claude-3-5-haiku-latest` | Optionnel |

> 🔒 Ta clé est rangée ici, côté serveur — **jamais** dans la page web.

---

## Étape 4 — La base de données (pour la limite stricte) 🗄️

C'est elle qui rend la limite **infranchissable**. ~5 minutes, gratuit.

1. Dans ton projet Vercel → onglet **Storage**.
2. **Create Database** → choisis **KV** (Redis) → **Continue**.
3. Donne un nom (ex. `compteur`) → **Create**.
4. Sur l'écran qui suit, **connecte la base à ton projet** (bouton **Connect Project** → choisis `studio-top-depart`). Vercel ajoute alors **tout seul** les variables `KV_REST_API_URL` et `KV_REST_API_TOKEN`.
5. Va dans **Deployments** → ⋯ sur le dernier → **Redeploy** (pour qu'il prenne la base en compte).

> ✅ Une fois la base connectée, le comptage par e-mail est actif et strict.
>
> ℹ️ **Sans cette étape**, le studio fonctionne quand même, mais la limite n'est pas stricte (utile pour tester avant). Tu peux donc lancer d'abord, ajouter la base ensuite.

---

## Étape 5 — Tester

Vercel te donne une adresse type `https://studio-top-depart.vercel.app`.

1. Ouvre-la → tu vois l'écran **« Entre ton e-mail pour commencer »**.
2. Entre un e-mail, crée un produit de test.
3. Recharge la page, vide ton navigateur, change d'appareil : ton **compteur reste le même** pour cet e-mail. 🎉
4. Partage l'adresse à tes clientes.

---

## 🔢 La limite de 10 — comment ça se passe pour tes clientes

- À l'arrivée, chaque cliente **entre son e-mail** (une fois ; il est mémorisé).
- Elle a droit à **10 créations** (chaque génération **ou** mise à jour = 1).
- Le compteur « Il te reste X créations » s'affiche en haut.
- À 0, un écran l'invite à te contacter.

**Changer le chiffre :** modifie `USAGE_LIMIT` dans Vercel (puis redéploie).
**Le lien « Contacter » :** dans l'aperçu ici, ouvre **Tweaks** → règle **`contactUrl`** (ton lien de contact, WhatsApp, ou `mailto:ton@mail.com`).

> ⚠️ **Seul contournement possible** : qu'une cliente utilise une **2ᵉ adresse e-mail**. Dans une formation payante, c'est une friction largement suffisante.

---

## 🛠️ Débloquer une cliente (page admin privée)

Si une cliente a payé un nouvel accès, ou pour voir son usage, ouvre dans ton navigateur (remplace `TON_SECRET` par ton `ADMIN_SECRET`) :

- **Voir son compteur :**
  `https://studio-top-depart.vercel.app/api/usage?secret=TON_SECRET&email=cliente@mail.com`
- **La remettre à zéro :**
  `https://studio-top-depart.vercel.app/api/usage?secret=TON_SECRET&email=cliente@mail.com&reset=1`

> Garde ton `ADMIN_SECRET` pour toi : c'est lui qui protège cette page.

---

## 💶 Surveiller tes coûts

Chaque création (et chaque demande à l'assistant IA) consomme un peu de ton crédit Anthropic. Pour suivre et plafonner : **https://console.anthropic.com** → **Billing / Limits** (tu peux fixer une limite de dépense mensuelle).

---

## 🔁 Modifier le studio plus tard

On améliore le studio ici → tu re-télécharges les fichiers → tu les re-déposes sur GitHub (Add file → Upload files → Commit) → Vercel **redéploie tout seul** en ~1 min. Ta clé, ta base et tes réglages restent en place.

---

Besoin d'aide à une étape ? Dis-moi où tu bloques (capture d'écran bienvenue) et je te débloque. 💜
