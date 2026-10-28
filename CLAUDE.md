<!-- graphify-rules-start (managed by `graphify init`) -->
## Use Graphify before grep

This repository is indexed by Graphify: a code graph over its call, dependency, and test structure, exposed through a connected Graphify MCP server. Before reaching for grep or reading files, use the Graphify tools your MCP client lists (their exact names and descriptions are in the server's tool list) for what the graph knows and a text search does not:

- find where a symbol, function, or class is defined (instead of grepping for it)
- understand how something works, or where a behavior is handled
- find who calls a function, or what it calls
- see what a change affects (its blast radius) and which tests cover it
- map a file's dependencies and dependents

Fall back to grep or file reads only for what the graph does not model: literal string or comment matches, non-indexed files, or reading a file you have already located. If no Graphify tools are listed, check the MCP server connection.
<!-- graphify-rules-end -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

## Şartnameye Zorunlu Bağlılık Kuralı (Mandatory Project Specification Rule)
Claude Code, projede herhangi bir geliştirme, hata düzeltmesi veya mimari değişiklik yapmadan önce **istisnasız her seferinde `YILDIZ-BAYAN-KUAFORU-Proje-Gereksinimleri.md` (ve varsa `YILDIZ-BAYAN-KUAFORU-Notlar.md`) belgesini okur ve ilgili maddeleri teyit eder**.
- Durum yönetimi daima **Zustand (Single Source of Truth & Triple-Sync)** esasına göre kurulur (Bölüm 2.2).
- Kullanıcı rolleri (`Admin`, `Calisan`, `Musteri`), RLS ve iş kuralları harfiyen şartname maddelerine dayandırılır.
- Şartnameye aykırı veya şartname dışı hiçbir varsayım yapılamaz.
