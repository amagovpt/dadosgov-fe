# CI/CD — content-backend

O pipeline (`.gitlab-ci.yml`) segue as convenções do catálogo `DevOps-Templates/ci-cd-devops-catalog`: stages, fluxo de branches, build com buildah para o Nexus, scanners do GitLab, promote GitOps e release notes. O catálogo não tem um componente para backends Node/Express, por isso o pipeline está definido neste repositório e não é incluído a partir do catálogo.

## Fluxo de branches

| Contexto | O que corre |
|---|---|
| Merge Request (ex.: `feat/*` → `develop`) | secret detection, SAST, dependency scanning, `version`, `build-code`, `lint-code` |
| `develop` | o mesmo, mais `package-code`, a imagem DEV (automática), container scanning e promote DEV |
| `release-X.Y.Z` | validação, `package-code`, imagens TST/PPR (manuais) e promotes TST/PPR (manuais) |
| tag `X.Y.Z` | `package-code`, imagem PRD (manual), promote PRD (manual), release notes e GitLab Release |
| `master`, `hotfix/*`, `feature/*`, `feat/*` | só validação |

Os pushes em `feature/*`/`feat/*` com um MR aberto não criam pipeline, porque o pipeline do MR substitui-o. As outras branches (`tst`, `ppr`, `main`, …) não disparam pipeline.

## Imagens

- **Registo:** `$NEXUS_REGISTRY_PUSH_URL/dadosgov/content-backend:<versão>-<env>.<pipeline iid>`, por exemplo `0.0.1-dev.42`.
- **Dockerfile do CI:** `.gitlab/docker/Dockerfile`. **Não corre npm.** O job `package-code` gera `publish/` (`build/` + `node_modules` só de produção + `package.json`) e o Dockerfile apenas copia essa pasta, à semelhança do `publish/` do componente .NET do catálogo. Recebe `--build-arg NEXUS_REGISTRY_PULL_URL` e corre como utilizador `node`.
- **`NODE_IMAGE` e a base do Dockerfile têm de ser a mesma imagem**, porque o `node_modules` é instalado no CI e copiado tal como está.
- **Dockerfile da raiz:** usado pelo `docker-compose.yml` em desenvolvimento local.

## Versões

A versão vem do campo `version` do `package.json`. O job `version` falha se uma branch `release-X.Y.Z` ou uma tag `X.Y.Z` não coincidir com essa versão.

Para fazer uma release:
1. Em `develop`, atualizar `version` no `package.json` (por exemplo `0.2.0`).
2. Criar a branch `release-0.2.0`. Daí saem as imagens e os deploys de TST e PPR.
3. Integrar em `master` e criar a tag `0.2.0`. Daí saem a imagem e o deploy de PRD e a GitLab Release.

## Variáveis

Variáveis de grupo/instância, as mesmas que o catálogo usa:
- `NEXUS_REGISTRY_PULL_URL`, `NEXUS_REGISTRY_PUSH_URL`, `NEXUS_REGISTRY_USER`, `NEXUS_REGISTRY_PASSWORD`
- `BUILDAH_IMAGE`, `TOOLBOX_IMAGE`, `RELEASE_CLI_IMAGE`, `SONAR_CLI_IMAGE`
- `CA_LCAMACA`, `SONAR_HOST_URL`, `SONAR_TOKEN`

Variáveis do projeto (Settings → CI/CD → Variables, *masked*):

| Variável | Para quê |
|---|---|
| `RELEASE_TOKEN` | Release notes através da API de changelog. Sem ela, as notas são geradas a partir do `git log`. |
| `DEPLOY_REPOSITORY` | Repositório GitOps de manifests (`grupo/repo`). |
| `DEPLOY_MANIFEST` | Caminho do manifest sem `.yaml`. |
| `DEPLOY_TOKEN` | Token com permissão de push no repositório GitOps. |

## Ativar o que está desligado

- **Deploy:** definir `DEPLOY_REPOSITORY`, `DEPLOY_MANIFEST` e `DEPLOY_TOKEN`. Os jobs `promote-*` passam a ser criados automaticamente. As branches de destino (`DEPLOYMENT_BRANCH_DEV/TST/PPR/PRD`, por omissão `DEV`/`TST`/`PPR`/`PRD`) mudam-se no topo do `.gitlab-ci.yml`.
- **Testes unitários:** criar o script `npm run test`. Tem de gerar `reports/junit.xml` e `coverage/cobertura-coverage.xml` (e `coverage/lcov.info` para o Sonar). Depois, pôr `UNIT_TESTS_ENABLED: "true"`.
- **SonarQube:** criar o projeto `dadosgov-content-backend` no SonarQube e pôr `SONAR_ENABLED: "true"`. A análise corre só em `develop` e espera pelo quality gate.

## Verificações locais

```bash
npm ci
npm run build
npm run lint
npm run format:check

# equivalente ao job package-code
rm -rf publish && mkdir publish && cp package.json package-lock.json publish/
(cd publish && npm ci --omit=dev) && cp -r build publish/build

docker build -f .gitlab/docker/Dockerfile -t content-backend:local .
```
