<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Deployment Workflow
- Toda alteração realizada no projeto deve obrigatoriamente acionar o fluxo de deploy.
- A sequência do deploy consiste em:
  1. `npm i`
  2. `npm run build`
  3. Deploy/Push para a branch `gh-pages` (e sincronização da `main`).

