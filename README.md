# Presenças Reuniões CCB

PRECISO DESENVOLER UM SISTEMA WEB QUE CONTE A PRESENÇA DE MUSÍCOS DE DETERMINADOS INSTRUMENTOS NA RUENIÃO DE AMANHÃ. O SISTEMA DEVE RODAR NA WEB PARA ACESSO SIMULTÂNEO POR MAIS LOGINS, E CADA INTERAÇÃO ACONTEÇA EM TEMPO REAL NA CHEGADA OS MUSICOS FALAM O NOME DIGITAMOS O NOME E APARECE OS DADOS PARA CONFIRMAR A PRESENÇA. EM ANEXO OS DADOS QUE PRECISAM CONSTAR NO BANCO DE DADOS , PRECISA CONTAR COM TODOS OS MÚSICOS, E TER A OPÇÃO DE ADICIONAR CASO NÃO APARECER VOU CRIAR ESTA APLICAÇÃO NO LOVABLE. DE O NOME DE CONTAGEM PRESENTES REUNIÃO MUSICAO CCB, PODE CRIAR UM NOME LEGAL VC CONSEGUE CRIR UM BANCO DE DADOS COM TODOS OS DA LISTA QUE TE ENVIEI E SEUS RESPECTIVOS INSTRUMENTOS?

Perfeito, dá pra fazer sim 🙌

### 1. Nome legal pro sistema

Sugestão de nome pro projeto (pode usar no Lovable):

**`MaestroCCB - Controle de Presenças`**
ou, se quiser algo mais direto:
**`CCB Maestro Presenças`**

---

### 2. Estrutura do banco de dados

Com base no relatório que você enviou, extraí para cada músico:

* `name` – Nome
* `instrument` – Instrumento (FLAUTA, CLARINETE, SAXOFONE ALTO, etc.)
* `localidade` – Congregação / Localidade
* `cargo_ministerio` – Músico, Instrutor, Encarregado, Secretário, etc.
* `nivel` – Oficializado(a), RJM, Culto oficial, Ensaio, etc.

Sugestão de tabela principal (Postgres/Supabase – que o Lovable costuma usar):

```sql
CREATE TABLE IF NOT EXISTS musicians (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  instrument TEXT NOT NULL,
  localidade TEXT,
  cargo_ministerio TEXT,
  nivel TEXT
);
```

Depois você terá outra tabela para as presenças em cada reunião, por exemplo:

```sql
CREATE TABLE IF NOT EXISTS attendances (
  id SERIAL PRIMARY KEY,
  musician_id INTEGER NOT NULL REFERENCES musicians(id),
  meeting_date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Com isso você consegue:

* Buscar o músico pelo nome
* Confirmar presença em tempo real
* Contar quantos presentes por instrumento em cada reunião

---

### 3. Arquivo com **todos os músicos + instrumentos** já pronto

Eu já li todo o PDF e gerei um script SQL com **673 músicos** da sua lista, cada um com:

* `name`
* `instrument`
* `localidade`
* `cargo_ministerio`
* `nivel`

O arquivo contém:

1. O `CREATE TABLE musicians ...`
2. Um `INSERT INTO musicians (...) VALUES (...)` com **todos** os registros.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ccbreunioes.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8c7e69c9-0326-4843-afd1-43150a77d769).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
