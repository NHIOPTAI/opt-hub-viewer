# OPT.AI Support Error Codes

## OPT-AUTH-001
Bedeutung:
Sitzung konnte nicht bestätigt werden.

Interne Prüfung:
- Cloudflare Access Session prüfen
- Weitergabe von cf-access-authenticated-user-email prüfen
- viewer-proxy Header-Weitergabe prüfen

---

## OPT-COL-001
Bedeutung:
User erkannt, aber keine freigegebenen Collections gefunden.

Interne Prüfung:
- viewer_user_collections prüfen
- user_email Schreibweise prüfen
- is_active prüfen

---

## OPT-CAT-001
Bedeutung:
Catalog / Inhaltsübersicht konnte nicht geladen werden.

Interne Prüfung:
- S3 Pfad für catalog.json prüfen
- collection.json prüfen
- collection_key prüfen
- Upload aus exporter.py prüfen

---

## OPT-DL-001
Bedeutung:
Download-Datei konnte nicht bereitgestellt werden.

Interne Prüfung:
- S3 Datei vorhanden?
- Presigned URL korrekt?
- XML/CSV/Manifest-Pfade prüfen

---

## OPT-SYS-001
Bedeutung:
Allgemeiner interner Fehler.

Interne Prüfung:
- CloudWatch Logs prüfen
- API-Konfiguration prüfen
- ENV Variablen prüfen
- allgemeine Ausnahme analysieren