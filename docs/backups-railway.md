# Backups PostgreSQL — Railway (Story 6.6, AC3)

Ce runbook décrit la sauvegarde et la restauration de la base PostgreSQL de production,
hébergée sur **Railway**. Conformément à la décision de la Story 6.6, les backups sont
**délégués au service managé Railway** (pas de cron `pg_dump` applicatif ni de scheduler) :
solo dev, budget infra 200 €, aucune surface de maintenance supplémentaire.

> Exigence (FR46, NFR-R2) : backup automatique quotidien à minuit (UTC), conservé **30 jours**.

## Configuration (à faire une fois, dashboard Railway)

1. Ouvrir le projet Railway → service **PostgreSQL** → onglet **Backups**.
2. Activer les **backups automatiques** (Scheduled backups).
3. Régler la **fréquence** sur quotidienne et la **fenêtre** vers **00:00 UTC**.
4. Régler la **rétention** sur **30 jours**.
5. Vérifier que le plan Railway du projet inclut les backups managés (sinon, upgrade requis).

> Les backups managés nécessitent un plan Railway compatible. Si le plan courant ne propose
> pas la rétention 30 j, soit l'augmenter, soit basculer sur l'option de secours ci-dessous.

## Vérification (après activation)

- Dans l'onglet **Backups**, confirmer qu'au moins un snapshot a été produit dans les 24 h.
- Confirmer que la date du plus ancien snapshot ne dépasse pas 30 jours (purge automatique).
- Re-vérifier mensuellement lors du contrôle ops.

## Restauration

1. Dashboard Railway → service PostgreSQL → onglet **Backups**.
2. Sélectionner le snapshot à la date voulue → **Restore**.
3. Railway recrée la base à partir du snapshot. Récupérer la nouvelle `DATABASE_URL`
   si elle change, et la mettre à jour dans les variables d'environnement du service API.
4. Redéployer / redémarrer le service API pour qu'il prenne la nouvelle connexion.

## Option de secours (manuelle, si besoin ponctuel)

En cas d'indisponibilité des backups managés, un dump manuel reste possible depuis un poste
disposant de `pg_dump` et de la `DATABASE_URL` de production :

```bash
pg_dump "$DATABASE_URL" | gzip > "db-$(date -u +%Y%m%d).sql.gz"
```

Restauration d'un dump manuel :

```bash
gunzip -c db-YYYYMMDD.sql.gz | psql "$DATABASE_URL"
```

> Cette voie est un filet de sécurité ponctuel, pas le mécanisme nominal : la sauvegarde
> récurrente reste celle de Railway.
